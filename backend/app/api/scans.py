from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.deps import get_db
from app.scanners.scan_runner import run_full_scan
from app.db.crud import (
    create_scan,
    get_scan,
    get_all_scans,
    get_findings_by_scan
)
from app.schemas.scan import ScanCreate, ScanResponse
from app.schemas.finding import FindingResponse
from app.agents.report_agent import generate_report
from app.agents.correlation_engine import run_correlation_engine
from app.db.crud import update_finding_correlation
router = APIRouter(prefix="/scans", tags=["scans"])

@router.post("/", response_model=ScanResponse)
def trigger_scan(
    scan_data: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Validate consent
    if not scan_data.consent_confirmed:
        raise HTTPException(
            status_code=400,
            detail="You must confirm consent before scanning"
        )

    # Validate target is not empty
    if not scan_data.target.strip():
        raise HTTPException(
            status_code=400,
            detail="Target cannot be empty"
        )

    # Create scan record in DB
    scan = create_scan(db, scan_data)

    # Background task placeholder — Week 3 replaces this
    # with actual scanner logic
    background_tasks.add_task(
    run_full_scan,
    scan_id=scan.id,
    target=scan.target,
    plugins_used=scan.plugins_used
)

    return scan

@router.get("/")
def list_scans(db: Session = Depends(get_db)):
    return get_all_scans(db)

@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan_by_id(scan_id: str, db: Session = Depends(get_db)):
    scan = get_scan(db, scan_id)
    if not scan:
        raise HTTPException(
            status_code=404,
            detail=f"Scan {scan_id} not found"
        )
    return scan

@router.get("/{scan_id}/findings", response_model=List[FindingResponse])
def get_scan_findings(scan_id: str, db: Session = Depends(get_db)):
    scan = get_scan(db, scan_id)
    if not scan:
        raise HTTPException(
            status_code=404,
            detail=f"Scan {scan_id} not found"
        )
    return get_findings_by_scan(db, scan_id)
@router.get("/{scan_id}/correlations")
def get_correlations(scan_id: str, db: Session = Depends(get_db)):
    scan = get_scan(db, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    findings = get_findings_by_scan(db, scan_id)

    # Run correlation engine
    correlations = run_correlation_engine(findings)

    # Save correlation results to DB
    for correlation in correlations:
        update_finding_correlation(
            db,
            correlation["finding_id"],
            correlation["correlation_group_id"],
            correlation["correlation_reason"]
        )

    # Group by correlation_group_id for response
    groups = {}
    for finding in findings:
        if finding.correlation_group_id:
            group_id = finding.correlation_group_id
            if group_id not in groups:
                groups[group_id] = {
                    "correlation_group_id": group_id,
                    "correlation_reason": finding.correlation_reason,
                    "findings": []
                }
            groups[group_id]["findings"].append({
                "id": finding.id,
                "description": finding.description,
                "ai_priority": finding.ai_priority,
                "category": finding.category
            })

    return list(groups.values())


@router.get("/{scan_id}/report")
def get_report(scan_id: str, db: Session = Depends(get_db)):
    scan = get_scan(db, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    findings = get_findings_by_scan(db, scan_id)

    scan_dict = {
        "target": scan.target,
        "created_at": str(scan.created_at),
        "plugins_used": scan.plugins_used
    }

    finding_dicts = [{
        "description": f.description,
        "ai_priority": f.ai_priority,
        "raw_severity": f.raw_severity,
        "ai_reasoning": f.ai_reasoning,
        "suggested_fix": f.suggested_fix,
        "category": f.category,
        "port": f.port,
        "service": f.service
    } for f in findings]

    report = generate_report(scan_dict, finding_dicts)
    return report

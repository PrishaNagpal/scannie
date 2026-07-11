from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.deps import get_db
from app.db.crud import (
    create_scan,
    get_scan,
    get_all_scans,
    get_findings_by_scan
)
from app.schemas.scan import ScanCreate, ScanResponse
from app.schemas.finding import FindingResponse

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
        run_scan_placeholder,
        scan_id=scan.id
    )

    return scan

@router.get("/", response_model=List[ScanResponse])
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

def run_scan_placeholder(scan_id: str):
    # Placeholder — Week 3 replaces this with real scanner
    print(f"Scan {scan_id} would run here")
    
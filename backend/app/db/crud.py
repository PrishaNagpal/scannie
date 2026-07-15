from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.scan import Scan
from app.models.finding import Finding
from app.schemas.scan import ScanCreate
import uuid
from datetime import datetime

def create_scan(db: Session, scan_data: ScanCreate) -> Scan:
    scan = Scan()
    scan.id = str(uuid.uuid4())
    scan.target = scan_data.target
    scan.plugins_used = scan_data.plugins_used
    scan.consent_confirmed = scan_data.consent_confirmed
    scan.status = "pending"
    scan.created_at = datetime.utcnow()
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan

def get_scan(db: Session, scan_id: str) -> Optional[Scan]:
    return db.query(Scan).filter(Scan.id == scan_id).first()

def get_all_scans(db: Session) -> List[Scan]:
    return db.query(Scan).order_by(Scan.created_at.desc()).all()

def get_findings_by_scan(db: Session, scan_id: str) -> List[Finding]:
    return db.query(Finding).filter(Finding.scan_id == scan_id).all()

def update_scan_status(
    db: Session,
    scan_id: str,
    status: str,
    error_message: Optional[str] = None
) -> Optional[Scan]:
    scan = get_scan(db, scan_id)
    if not scan:
        return None
    scan.status = status
    if status == "completed" or status == "failed":
        scan.completed_at = datetime.utcnow()
    if error_message:
        scan.error_message = error_message
    db.commit()
    db.refresh(scan)
    return scan
def create_finding(db: Session, finding_data: dict, scan_id: str) -> Finding:
    finding = Finding()
    finding.id = str(uuid.uuid4())
    finding.scan_id = scan_id
    finding.target = finding_data["target"]
    finding.source_plugin = finding_data["source_plugin"]
    finding.category = finding_data["category"]
    finding.port = finding_data.get("port")
    finding.service = finding_data.get("service")
    finding.service_version = finding_data.get("service_version")
    finding.raw_severity = finding_data.get("raw_severity")
    finding.description = finding_data["description"]
    finding.evidence = finding_data.get("evidence")
    finding.discovered_at = finding_data.get("discovered_at", datetime.utcnow())
    db.add(finding)
    db.commit()
    db.refresh(finding)
    return finding
def update_finding_ai_results(
    db: Session,
    finding_id: str,
    ai_priority: str,
    ai_reasoning: str,
    suggested_fix: str
) -> Optional[Finding]:
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        return None
    finding.ai_priority = ai_priority
    finding.ai_reasoning = ai_reasoning
    finding.suggested_fix = suggested_fix
    db.commit()
    db.refresh(finding)
    return finding

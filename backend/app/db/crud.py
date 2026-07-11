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

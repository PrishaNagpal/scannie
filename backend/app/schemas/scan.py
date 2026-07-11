from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ScanCreate(BaseModel):
    target: str
    plugins_used: List[str] = ["nmap", "tls", "web"]
    consent_confirmed: bool

class ScanResponse(BaseModel):
    id: str
    target: str
    status: str
    plugins_used: List[str]
    consent_confirmed: bool
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True
        
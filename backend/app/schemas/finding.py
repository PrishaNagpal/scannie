from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FindingResponse(BaseModel):
    id: str
    scan_id: str
    target: str
    source_plugin: str
    category: str
    port: Optional[int] = None
    service: Optional[str] = None
    service_version: Optional[str] = None
    raw_severity: Optional[str] = None
    description: str
    evidence: Optional[str] = None
    discovered_at: datetime
    ai_priority: Optional[str] = None
    ai_reasoning: Optional[str] = None
    suggested_fix: Optional[str] = None
    correlation_group_id: Optional[str] = None
    correlation_reason: Optional[str] = None

    class Config:
        from_attributes = True
        
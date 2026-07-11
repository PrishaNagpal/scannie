import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    target = Column(String, nullable=False)
    source_plugin = Column(String, nullable=False)
    category = Column(String, nullable=False)
    port = Column(Integer, nullable=True)
    service = Column(String, nullable=True)
    service_version = Column(String, nullable=True)
    raw_severity = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    discovered_at = Column(DateTime, default=datetime.utcnow)

    # AI fields - filled in later by agents (Week 4-5)
    ai_priority = Column(String, nullable=True)
    ai_reasoning = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)
    correlation_group_id = Column(String, nullable=True)
    correlation_reason = Column(Text, nullable=True)

    scan = relationship("Scan", back_populates="findings")
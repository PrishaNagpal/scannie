import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True)
    target = Column(String, nullable=False)
    status = Column(String, default="pending")
    plugins_used = Column(JSON)
    consent_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    findings = relationship("Finding", back_populates="scan")
    
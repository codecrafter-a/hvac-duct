from sqlalchemy import Column, Integer, String, DateTime, Text, func
from database import Base


class HvacJob(Base):
    __tablename__ = "hvac_jobs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    status = Column(String(50), default="processing", nullable=False)
    result_json = Column(Text, nullable=True)
    annotated_image_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

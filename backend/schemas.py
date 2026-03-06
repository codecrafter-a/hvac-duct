from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PressureClass(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DuctShape(str, Enum):
    ROUND = "round"
    RECTANGULAR = "rectangular"


class Point(BaseModel):
    x: float
    y: float


class DuctDimension(BaseModel):
    shape: DuctShape
    diameter: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    raw_text: str = Field(..., description="Original OCR text")


class DuctSegment(BaseModel):
    id: int
    shape: DuctShape
    dimension: DuctDimension
    pressure_class: PressureClass
    start_point: Point
    end_point: Point
    center_point: Point
    confidence: float = Field(ge=0, le=1)


class ProcessingResult(BaseModel):
    job_id: str
    filename: str
    ducts: List[DuctSegment]
    annotated_image_url: str
    total_ducts: int
    processing_time_seconds: float

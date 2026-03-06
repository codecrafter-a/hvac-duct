from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path
import json
import uuid
import cv2

from database import engine, get_db, Base
from models import HvacJob
from schemas import ProcessingResult
from duct_detector import DuctDetector

# Create tables
Base.metadata.create_all(bind=engine)

# Create storage directories
storage_path = Path(__file__).parent / "storage"
storage_path.mkdir(exist_ok=True)
(storage_path / "uploads").mkdir(exist_ok=True)
(storage_path / "results").mkdir(exist_ok=True)

app = FastAPI(
    title="HVAC Duct Annotation API",
    description="Automatically detect and annotate HVAC ducts in floor plans",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/api/hvac/process")
async def process_hvac_drawing(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Process an HVAC drawing for duct detection and annotation."""
    try:
        job_id = str(uuid.uuid4())
        upload_path = storage_path / "uploads" / f"{job_id}_{file.filename}"

        contents = await file.read()
        with open(upload_path, "wb") as f:
            f.write(contents)

        hvac_job = HvacJob(
            filename=f"{job_id}_{file.filename}",
            original_filename=file.filename,
            status="processing"
        )
        db.add(hvac_job)
        db.commit()
        db.refresh(hvac_job)

        detector = DuctDetector()
        result = detector.process(str(upload_path))

        annotated_image = result["annotated_image"]
        image_filename = f"{job_id}_annotated.png"
        image_path = storage_path / "results" / image_filename
        cv2.imwrite(str(image_path), annotated_image)

        ducts_data = []
        for d in result["ducts"]:
            ducts_data.append({
                "id": d.id,
                "shape": d.shape.value,
                "dimension": {
                    "shape": d.dimension.shape.value,
                    "diameter": d.dimension.diameter,
                    "width": d.dimension.width,
                    "height": d.dimension.height,
                    "raw_text": d.dimension.raw_text,
                },
                "pressure_class": d.pressure_class.value,
                "start_point": {"x": int(d.start_point.x), "y": int(d.start_point.y)},
                "end_point": {"x": int(d.end_point.x), "y": int(d.end_point.y)},
                "center_point": {"x": int(d.center_point.x), "y": int(d.center_point.y)},
                "confidence": float(d.confidence),
            })

        result_json = {
            "job_id": job_id,
            "filename": file.filename,
            "ducts": ducts_data,
            "annotated_image_url": f"/results/{job_id}_annotated.png",
            "total_ducts": len(result["ducts"]),
            "processing_time_seconds": result["processing_time"],
        }

        hvac_job.status = "completed"
        hvac_job.result_json = json.dumps(result_json)
        hvac_job.annotated_image_path = f"results/{image_filename}"
        db.add(hvac_job)
        db.commit()

        return result_json

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/hvac/results/{job_id}")
def get_hvac_results(job_id: str, db: Session = Depends(get_db)):
    """Get processing results for a job."""
    job = db.query(HvacJob).filter(HvacJob.filename.like(f"{job_id}_%")).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != "completed":
        raise HTTPException(status_code=202, detail="Job still processing")

    return json.loads(job.result_json)


# Mount static files for serving annotated images
app.mount("/results", StaticFiles(directory=str(storage_path / "results")), name="results")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# HVAC Duct Annotation System

A comprehensive system for automatically detecting, annotating, and classifying HVAC ducts in mechanical floor plan drawings using Computer Vision and OCR.

## Overview

This application processes HVAC floor plans to automatically identify duct lines, extract dimensions using OCR, and classify ducts by pressure rating. The system provides an interactive web interface for viewing and analyzing results.

## Features

- Automatic Duct Detection: Uses OpenCV HSV color segmentation to identify blue duct lines
- Dimension Extraction: Tesseract OCR reads duct labels (14"D, 12x8, etc.)
- Pressure Classification: Automatically classifies ducts as Low/Medium/High based on size
- Interactive Viewer: Click ducts to see details and view in table format
- Color-Coded Annotations: Green/Yellow/Red indicates pressure class
- Batch Processing: Process drawings one at a time with database storage

## Quick Start

### Prerequisites

Before starting, install system dependencies:

```sh
brew install tesseract poppler
```

If you don't have Node.js installed, download from [https://nodejs.org](https://nodejs.org)

### One-Command Setup and Run

```sh
chmod +x run.sh
./run.sh
```

This will:

1. Install all dependencies (backend and frontend)
2. Start the backend API on [http://localhost:8000](http://localhost:8000)
3. Start the frontend on [http://localhost:3000](http://localhost:3000)
4. Open the application in your browser

The backend and frontend will run in parallel in your terminal. Press Ctrl+C to stop both.

### Manual Setup (if needed)

**Backend Setup:**

```sh
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend will run on: [http://localhost:8000](http://localhost:8000)

**Frontend Setup (in another terminal):**

```sh
cd frontend
npm install
npm run dev
```

Frontend will run on: [http://localhost:3000](http://localhost:3000)

## Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Drag and drop a PDF or image of an HVAC floor plan
3. Wait 1-3 seconds for processing
4. Click on ducts to see details or view all results in the table

## Project Structure

```
hvac-duct/
├── backend/
│   ├── main.py                  # FastAPI application and endpoints
│   ├── duct_detector.py         # CV/OCR processing pipeline
│   ├── schemas.py               # Pydantic data models
│   ├── models.py                # SQLAlchemy ORM models
│   ├── database.py              # Database configuration
│   ├── requirements.txt          # Python dependencies
│   ├── storage/                 # Uploaded files and results
│   └── venv/                    # Python virtual environment
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Main application page
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Tailwind CSS styles
│   ├── components/
│   │   ├── DrawingUpload.tsx    # File upload component
│   │   ├── AnnotatedViewer.tsx  # Image viewer with overlays
│   │   ├── DuctInfoPanel.tsx    # Duct details panel
│   │   └── DuctTable.tsx        # Data table component
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── types.ts             # TypeScript interfaces
│   ├── hooks/
│   │   └── useHvac.ts           # State management hook
│   ├── package.json
│   └── .env.local
│
├── README.md
├── run.sh                       # Single command to run both services
└── .gitignore
```

## API Endpoints

### Upload and Process

**POST** `/api/hvac/process`

Upload a drawing file for processing:

```sh
curl -X POST http://localhost:8000/api/hvac/process \
  -F "file=@drawing.pdf"
```

Response:

```json
{
  "job_id": "uuid-string",
  "filename": "drawing.pdf",
  "total_ducts": 12,
  "annotated_image_url": "/results/uuid_annotated.png",
  "processing_time_seconds": 2.34,
  "ducts": [...]
}
```

### Get Results

**GET** `/api/hvac/results/{job_id}`

Retrieve processing results for a completed job.

### Get Annotated Image

**GET** `/results/{job_id}_annotated.png`

Retrieve the annotated image with duct overlays.

## Pressure Classification

Ducts are automatically classified based on their dimensions:


| Pressure Class | Round Duct           | Rectangular Duct | Color  |
| -------------- | -------------------- | ---------------- | ------ |
| Low            | <= 8" diameter       | < 50 sq in       | Green  |
| Medium         | 8" < diameter <= 18" | 50-250 sq in     | Yellow |
| High           | > 18" diameter       | > 250 sq in      | Red    |


## Technology Stack

**Backend:**

- FastAPI: Web framework and API
- SQLAlchemy: Database ORM
- OpenCV: Image processing and contour detection
- Tesseract: OCR for text extraction
- Pydantic: Data validation
- SQLite: Database

**Frontend:**

- Next.js 16: React framework
- React 19: UI library
- TypeScript: Type-safe development
- Tailwind CSS: Styling

## How It Works

### Processing Pipeline

1. **Image Loading**: Load image or PDF file
2. **Color Detection**: Convert to HSV and filter for blue duct lines (H: 100-140)
3. **Image Processing**: Apply morphological operations (erosion/dilation)
4. **Contour Detection**: Identify duct line contours
5. **Text Extraction**: Use Tesseract OCR to extract dimensions from image
6. **Text Association**: Match nearest OCR text to each detected duct
7. **Dimension Parsing**: Extract measurements using regex patterns:
  - Round ducts: "14"D", "14D"
  - Rectangular ducts: "12x8", "12"x8""
8. **Classification**: Assign pressure class based on duct size
9. **Annotation**: Draw color-coded overlays on original image
10. **Storage**: Save results to database and filesystem

## Configuration

### Backend

- Database: SQLite (hvac.db in backend directory)
- File Storage: backend/storage/{uploads,results}
- API Port: 8000
- CORS: Enabled for all origins

### Frontend

- API Base URL: [http://localhost:8000](http://localhost:8000) (via .env.local)
- Dev Port: 3000

## Troubleshooting


| Issue                    | Solution                                                                    |
| ------------------------ | --------------------------------------------------------------------------- |
| `tesseract not found`    | Run `brew install tesseract`                                                |
| `No module named cv2`    | Ensure venv is activated: `source backend/venv/bin/activate`                |
| Frontend shows blank     | Verify backend is running on [http://localhost:8000](http://localhost:8000) |
| No ducts detected        | Check that drawing has blue-colored duct lines                              |
| Port already in use      | Kill process: `lsof -ti:8000` or `lsof -ti:3000`                            |
| `npm: command not found` | Install Node.js from [https://nodejs.org](https://nodejs.org)               |


## Performance

- Processing time: 1-3 seconds per drawing
- Maximum file size: ~20MB
- Supported formats: PDF, PNG, JPG, TIFF

## Development

### Add Backend Dependencies

```sh
cd backend
source venv/bin/activate
pip install <package_name>
pip freeze > requirements.txt
```

### Add Frontend Dependencies

```sh
cd frontend
npm install <package_name>
```

### Build for Production

**Frontend:**

```sh
cd frontend
npm run build
npm start
```

## Environment Variables

**Frontend (.env.local):**

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```




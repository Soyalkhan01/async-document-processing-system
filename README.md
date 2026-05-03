# Async Document Processing Workflow System
## 🌐 Live Demo

Frontend (if deployed):
https://async-document-frontend.onrender.com/

Backend (Render API):
https://async-document-processing-system-e0oc.onrender.com

## 🎥 Demo Video

https://your-demo-video-link.com

## ⚙️ Tech Stack

Frontend:
- React
- TypeScript
- Axios

## Tech Stack

Frontend:
- React + TypeScript

Backend:
- FastAPI

Database:
- PostgreSQL

Background Processing:
- Celery

Messaging:
- Redis Pub/Sub

---

# Features

- Upload documents
- Async background processing
- Celery worker processing
- Redis Pub/Sub progress tracking
- Live progress updates
- Search documents
- Filter by status
- Sorting
- Document detail view
- Edit extracted data
- Finalize documents
- Retry failed jobs
- Export JSON
- Export CSV

---

# Project Architecture

Frontend:
- React dashboard UI
- Axios API integration
- Live progress polling

Backend:
- FastAPI REST APIs
- PostgreSQL database
- Celery worker
- Redis Pub/Sub events

Workflow:
1. Upload document
2. Save metadata
3. Create Celery job
4. Worker processes document
5. Redis publishes progress
6. Frontend displays updates
7. User reviews result
8. Finalize/export

---

# Setup Instructions

## Backend

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI:

```bash
uvicorn app.main:app --reload
```

Run Celery Worker:

```bash
celery -A app.tasks worker --loglevel=info --pool=solo
```

---

## Frontend

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

---

# Redis

Run Redis server locally on:

```txt
localhost:6379
```

---

# Assumptions

- Files are processed locally
- Mock extraction data is used
- Polling is used for progress tracking

---

# Tradeoffs

- Polling used instead of WebSocket
- Simple extraction logic
- Local file storage

---

# Limitations

- No authentication
- No Docker setup
- No cloud deployment
- No advanced OCR/AI extraction

---

# Sample Export Formats

- JSON export
- CSV export

---

# AI Tool Usage

AI tools were used for:
- debugging
- architecture guidance
- frontend/backend integration help
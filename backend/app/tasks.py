from celery import Celery
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Document

import time
import json
import redis
import os

# =========================
# ENV (LOCAL + RENDER SAFE)
# =========================
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# =========================
# CELERY SETUP
# =========================
celery = Celery(
    "tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# =========================
# REDIS CLIENT
# =========================
redis_client = redis.Redis.from_url(
    REDIS_URL,
    decode_responses=True
)

# =========================
# PROGRESS FUNCTION
# =========================
def publish_progress(document_id, event, progress):
    redis_client.publish(
        "document_progress",
        json.dumps({
            "document_id": document_id,
            "event": event,
            "progress": progress
        })
    )

# =========================
# MAIN TASK
# =========================
@celery.task
def process_document(document_id):

    db: Session = SessionLocal()

    try:
        document = db.query(Document).filter(Document.id == document_id).first()

        if not document:
            return

        document.status = "processing"
        db.commit()

        publish_progress(document_id, "job_started", 10)
        time.sleep(1)

        publish_progress(document_id, "parsing_started", 30)
        time.sleep(1)

        publish_progress(document_id, "parsing_completed", 50)
        time.sleep(1)

        publish_progress(document_id, "extracting_fields", 70)
        time.sleep(1)

        extracted_data = {
            "title": document.filename,
            "summary": "Processed successfully",
            "keywords": ["fastapi", "celery", "redis"]
        }

        document.extracted_data = json.dumps(extracted_data)

        publish_progress(document_id, "fields_completed", 90)
        time.sleep(1)

        document.status = "completed"
        db.commit()

        publish_progress(document_id, "done", 100)

    except Exception as e:
        document.status = "failed"
        db.commit()

        publish_progress(document_id, "failed", 0)

        print("ERROR:", e)

    finally:
        db.close()
from celery import Celery
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Document

import time
import json
import redis

celery = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True
)


def publish_progress(
    document_id,
    event,
    progress
):

    data = {
        "document_id": document_id,
        "event": event,
        "progress": progress
    }

    redis_client.publish(
        "document_progress",
        json.dumps(data)
    )


@celery.task
def process_document(document_id):

    db: Session = SessionLocal()

    try:

        document = db.query(Document).filter(
            Document.id == document_id
        ).first()

        if not document:
            return

        document.status = "processing"

        db.commit()

        publish_progress(
            document_id,
            "job_started",
            10
        )

        time.sleep(2)

        publish_progress(
            document_id,
            "document_parsing_started",
            30
        )

        time.sleep(2)

        publish_progress(
            document_id,
            "document_parsing_completed",
            50
        )

        time.sleep(2)

        publish_progress(
            document_id,
            "field_extraction_started",
            70
        )

        time.sleep(2)

        extracted_data = {
            "title": document.filename,
            "category": "sample",
            "summary": "Document processed successfully",
            "keywords": [
                "fastapi",
                "celery",
                "redis"
            ]
        }

        document.extracted_data = json.dumps(
            extracted_data
        )

        publish_progress(
            document_id,
            "field_extraction_completed",
            90
        )

        time.sleep(2)

        document.status = "job_completed"

        db.commit()

        publish_progress(
            document_id,
            "job_completed",
            100
        )

    except Exception as e:

        document.status = "failed"

        db.commit()

        publish_progress(
            document_id,
            "job_failed",
            0
        )

        print(e)

    finally:

        db.close()
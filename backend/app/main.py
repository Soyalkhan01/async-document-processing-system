from fastapi import FastAPI
from fastapi import UploadFile
from fastapi import File
from fastapi import HTTPException
from fastapi import Query

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from .tasks import process_document
from .schemas import UpdateDocumentRequest
from .database import engine
from .database import SessionLocal
from .models import Base
from .models import Document

import shutil
import os
import csv
import redis
import json

app = FastAPI()

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


@app.get("/")
def home():
    return {
        "message": "Backend Running"
    }


@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    file_path = f"{UPLOAD_FOLDER}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    db: Session = SessionLocal()

    document = Document(
        filename=file.filename,
        file_type=file.content_type,
        file_size=file_size,
        status="queued",
        finalized=False
    )

    db.add(document)

    db.commit()

    db.refresh(document)

    process_document.delay(document.id)

    db.close()

    return {
        "message": "File uploaded successfully",
        "document_id": document.id,
        "status": "queued"
    }


@app.get("/documents")
def get_documents(
    search: str = Query(default=""),
    status: str = Query(default=""),
    sort_by: str = Query(default="id")
):

    db: Session = SessionLocal()

    query = db.query(Document)

    if search:
        query = query.filter(
            Document.filename.ilike(f"%{search}%")
        )

    if status:
        query = query.filter(
            Document.status == status
        )

    if sort_by == "filename":
        query = query.order_by(
            Document.filename.asc()
        )
    else:
        query = query.order_by(
            Document.id.desc()
        )

    documents = query.all()

    result = []

    for doc in documents:
        result.append({
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "status": doc.status,
            "finalized": doc.finalized,
            "created_at": str(doc.created_at) if hasattr(doc, "created_at") else None
        })

    db.close()

    return result


@app.get("/documents/{document_id}")
def get_document(document_id: int):

    db: Session = SessionLocal()

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:

        db.close()

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    result = {
        "id": document.id,
        "filename": document.filename,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "status": document.status,
        "finalized": document.finalized,
        "extracted_data": document.extracted_data,
        "created_at": str(document.created_at) if hasattr(document, "created_at") else None
    }

    db.close()

    return result


@app.put("/documents/{document_id}")
def update_document(
    document_id: int,
    request: UpdateDocumentRequest
):

    db: Session = SessionLocal()

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:

        db.close()

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    document.extracted_data = request.extracted_data

    db.commit()

    db.refresh(document)

    db.close()

    return {
        "message": "Document updated successfully"
    }


@app.put("/documents/{document_id}/finalize")
def finalize_document(document_id: int):

    db: Session = SessionLocal()

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:

        db.close()

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    document.finalized = True
    document.status = "finalized"

    db.commit()

    db.refresh(document)

    db.close()

    return {
        "message": "Document finalized successfully"
    }


@app.delete("/documents/{document_id}")
def delete_document(document_id: int):

    db: Session = SessionLocal()

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:

        db.close()

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    file_path = f"{UPLOAD_FOLDER}/{document.filename}"

    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(document)

    db.commit()

    db.close()

    return {
        "message": "Document deleted successfully"
    }


@app.get("/export/json")
def export_json():

    db: Session = SessionLocal()

    documents = db.query(Document).filter(
        Document.finalized == True
    ).all()

    result = []

    for doc in documents:

        result.append({
            "id": doc.id,
            "filename": doc.filename,
            "status": doc.status,
            "extracted_data": doc.extracted_data
        })

    db.close()

    return result


@app.get("/export/csv")
def export_csv():

    db: Session = SessionLocal()

    documents = db.query(Document).filter(
        Document.finalized == True
    ).all()

    file_path = "export.csv"

    with open(
        file_path,
        mode="w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.writer(file)

        writer.writerow([
            "ID",
            "Filename",
            "Status",
            "Extracted Data"
        ])

        for doc in documents:

            writer.writerow([
                doc.id,
                doc.filename,
                doc.status,
                doc.extracted_data
            ])

    db.close()

    return FileResponse(
        path=file_path,
        filename="export.csv",
        media_type="text/csv"
    )
@app.get("/progress")
def get_progress():

    pubsub = redis_client.pubsub()

    pubsub.subscribe(
        "document_progress"
    )

    message = pubsub.get_message()

    if (
        message and
        message["type"] == "message"
    ):

        return json.loads(
            message["data"]
        )

    return {}

@app.post("/documents/{document_id}/retry")
def retry_document(document_id: int):

    db: Session = SessionLocal()

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:

        db.close()

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    document.status = "queued"

    db.commit()

    process_document.delay(document.id)

    db.close()

    return {
        "message": "Retry started successfully"
    }
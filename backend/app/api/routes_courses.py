from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel

from backend.app.database.connection import get_db
from backend.app.models.entities import Course, Document, Topic, Concept, KnowledgeUnit
from backend.app.ingestion.multimodal_service import MultimodalIngestionService
from backend.app.services.source_explorer import SourceExplorerService

router = APIRouter(prefix="/courses", tags=["Courses & Ingestion"])

class CreateCourseRequest(BaseModel):
    code: str
    title: str
    description: Optional[str] = "Interactive multimodal course"
    domain: Optional[str] = "Computer Science"

@router.get("")
async def list_courses(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Course).order_by(Course.created_at.desc()))
    courses = res.scalars().all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "description": c.description,
            "domain": c.domain,
            "status": c.status,
            "is_demo_course": c.is_demo_course,
            "created_at": c.created_at.isoformat()
        }
        for c in courses
    ]

@router.post("")
async def create_course(req: CreateCourseRequest, db: AsyncSession = Depends(get_db)):
    course = Course(
        code=req.code,
        title=req.title,
        description=req.description,
        domain=req.domain,
        status="READY"
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "status": course.status
    }

@router.get("/{course_id}")
async def get_course(course_id: str, db: AsyncSession = Depends(get_db)):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "description": course.description,
        "status": course.status,
        "is_demo_course": course.is_demo_course
    }

@router.post("/{course_id}/upload")
async def upload_course_document(
    course_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests PDF, PPTX, DOCX, TXT, MP4 transcripts, or Images directly into the course.
    """
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    content_bytes = await file.read()
    if len(content_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = await MultimodalIngestionService.process_document(
            db=db,
            course_id=course_id,
            filename=file.filename,
            file_bytes=content_bytes
        )
        return {
            "status": "success",
            "message": f"Successfully processed {file.filename}",
            "ingestion_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.get("/{course_id}/documents")
async def list_course_documents(course_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Document).filter(Document.course_id == course_id).order_by(Document.created_at.desc())
    )
    docs = res.scalars().all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size_bytes,
            "status": d.status,
            "progress_percent": d.progress_percent,
            "error_message": d.error_message,
            "created_at": d.created_at.isoformat()
        }
        for d in docs
    ]

@router.get("/{course_id}/tree")
async def get_course_explorer_tree(course_id: str, db: AsyncSession = Depends(get_db)):
    return await SourceExplorerService.get_course_explorer_tree(db, course_id)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.app.database.connection import get_db
from backend.app.services.knowledge_graph import KnowledgeGraphService
from backend.app.services.source_explorer import SourceExplorerService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/knowledge", tags=["Knowledge Graph & Explorer"])

@router.get("/graph/{course_id}")
async def get_knowledge_graph(course_id: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    return await KnowledgeGraphService.get_course_knowledge_graph(db, course_id, user_id=user.id)

@router.get("/concept/{concept_id}")
async def get_concept_details(concept_id: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    return await SourceExplorerService.get_concept_details(db, concept_id, user_id=user.id)

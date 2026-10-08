import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app.config.settings import settings
from backend.app.database.connection import init_db

# Routers
from backend.app.api.routes_auth import router as auth_router
from backend.app.api.routes_courses import router as courses_router
from backend.app.api.routes_tutor import router as tutor_router
from backend.app.api.routes_assessment import router as assessment_router
from backend.app.api.routes_learner import router as learner_router
from backend.app.api.routes_planner import router as planner_router
from backend.app.api.routes_flashcards import router as flashcards_router
from backend.app.api.routes_revision import router as revision_router
from backend.app.api.routes_exams import router as exams_router
from backend.app.api.routes_coding import router as coding_router
from backend.app.api.routes_games import router as games_router
from backend.app.api.routes_knowledge import router as knowledge_router
from backend.app.api.routes_recommendations import router as recommendations_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("edupath")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing EduPath AI Database & Services...")
    await init_db()
    logger.info("EduPath AI services operational.")
    yield
    logger.info("EduPath AI shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="EduPath AI — Multimodal, Source-Grounded, Adaptive AI Learning Companion",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred.",
            "error_type": type(exc).__name__,
            "message": str(exc)
        }
    )

# Include all API routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(courses_router, prefix="/api")
app.include_router(tutor_router, prefix="/api")
app.include_router(assessment_router, prefix="/api")
app.include_router(learner_router, prefix="/api")
app.include_router(planner_router, prefix="/api")
app.include_router(flashcards_router, prefix="/api")
app.include_router(revision_router, prefix="/api")
app.include_router(exams_router, prefix="/api")
app.include_router(coding_router, prefix="/api")
app.include_router(games_router, prefix="/api")
app.include_router(knowledge_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EduPath AI Unified Platform",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# Mount static frontend build if built in frontend/dist
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(FRONTEND_DIST) and os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
    if os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
        app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(target_path) and os.path.isfile(target_path):
            return FileResponse(target_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

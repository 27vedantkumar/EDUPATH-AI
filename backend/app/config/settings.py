import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduPath AI — Multimodal Adaptive Learning Companion"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security & Tokens
    SECRET_KEY: str = "edupath-super-secret-key-change-in-production-entropy-grade"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./edupath_multimodal.db"
    
    # Storage & Vectors
    STORAGE_PATH: str = "./uploads"
    VECTOR_STORE_PATH: str = "./vector_store"
    
    # AI Providers
    DEFAULT_AI_PROVIDER: str = "auto"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # RAG & Grounding Gate
    RAG_SIMILARITY_THRESHOLD: float = 0.68
    GROUNDING_CONFIDENCE_THRESHOLD: float = 0.75
    MAX_CONTEXT_CHUNKS: int = 6
    ENABLE_HYBRID_BM25: bool = True
    
    # Code Execution Sandbox Limits
    CODE_RUN_TIMEOUT_SECONDS: int = 4
    MAX_CODE_LENGTH: int = 10000
    MAX_OUTPUT_BYTES: int = 50000
    SANDBOX_MEMORY_LIMIT_MB: int = 128
    
    # Server & Networking
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:8000,*"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

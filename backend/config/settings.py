import os
from typing import List
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Information
    APP_NAME: str = "AetherOS"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    
    # Security
    # In production, replace with a strong, randomly generated hex secret key
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-aetheros-encryption-key-that-is-long-and-random-3948293849")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for local-first system convenience
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./aetheros.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Vector DB (ChromaDB)
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    
    # Local Provider Endpoints
    OLLAMA_ENDPOINT: str = "http://localhost:11434"
    LMSTUDIO_ENDPOINT: str = "http://localhost:1234"
    LLAMACPP_ENDPOINT: str = "http://localhost:8080"
    VLLM_ENDPOINT: str = "http://localhost:8000"
    
    # Default Inference Model Mapping
    DEFAULT_CHAT_MODEL: str = "qwen2.5-7b"
    DEFAULT_EMBEDDING_MODEL: str = "nomic-embed-text"
    
    # OpenTelemetry
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    ENABLE_TRACING: bool = False

    # Configuration for loading .env files
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

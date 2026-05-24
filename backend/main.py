import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config.settings import settings
from backend.api.routers import chat, system

# Phase 2 Database and REST Route Imports
from backend.app.memory.persistence.db_session import init_db
from backend.app.memory.api import sessions, memories

# Phase 3 Agent REST Endpoints
from backend.app.agents.api import agent_endpoints


# Setup clean structured console logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("aetheros.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles global lifespan setups and connection shutdowns for clean resources management.
    """
    logger.info("Initializing AetherOS Server Engine...")
    
    # Bootstrap relational tables natively on launch
    try:
        await init_db()
    except Exception as dbe:
        logger.error(f"Failed to initialize database connection: {dbe}")
    
    # Verify Ollama/LM Studio local runtimes on startup
    try:
        healths = await chat.ai_router.health_check_all()
        for prov_name, health in healths.items():
            logger.info(f"Local provider '{prov_name}' status on startup: {health.status.value.upper()} (Latency: {health.latency_ms:.1f}ms)")
    except Exception as e:
        logger.warning(f"Failed to query local model providers on startup: {e}")
        
    yield
    
    logger.info("Tearing down AetherOS server client connection pools...")
    # Close HTTP Client pools on providers if they have explicit close hooks
    for provider in chat.ai_router.providers.values():
        if hasattr(provider, "client") and hasattr(provider.client, "aclose"):
            await provider.client.aclose()
    logger.info("AetherOS Server Engine shutdown complete.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Sovereign Local-First AI Operating System Server Gateway",
    version="2.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints under central prefix
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["chat"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["system"])
app.include_router(sessions.router, prefix=f"{settings.API_V1_STR}/sessions", tags=["sessions"])
app.include_router(memories.router, prefix=f"{settings.API_V1_STR}/memories", tags=["memories"])
app.include_router(agent_endpoints.router, prefix=f"{settings.API_V1_STR}/agents", tags=["agents"])


@app.get("/health", tags=["system"])
async def root_health_check():
    """
    Standard top-level health probe checking gateway operational status.
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    # Allow executing backend file directly for quick native local testing
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

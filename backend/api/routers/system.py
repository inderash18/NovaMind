import logging
from typing import Dict, Any
from fastapi import APIRouter

from providers.router import AIRouter
from providers.base import ProviderHealth

logger = logging.getLogger("aetheros.api.routers.system")
router = APIRouter()

# Share the global AIRouter singleton instantiated in the chat router
from backend.api.routers.chat import ai_router

@router.get("/status")
async def get_system_status() -> Dict[str, Any]:
    """
    Returns aggregated health status matrix for all local inference providers.
    """
    try:
        health_matrix = await ai_router.health_check_all()
        # Format Pydantic models to serializable dicts
        serializable_matrix = {name: health.model_dump() for name, health in health_matrix.items()}
        
        return {
            "status": "online",
            "providers": serializable_matrix,
        }
    except Exception as e:
        logger.error(f"Failed to compile system health matrix: {e}")
        return {
            "status": "degraded",
            "error": str(e)
        }

@router.get("/models")
async def get_system_models() -> Dict[str, Any]:
    """
    Retrieves and lists all local model checkpoints cached in provider runtimes.
    """
    try:
        models = await ai_router.list_all_models()
        return {
            "models": models
        }
    except Exception as e:
        logger.error(f"Failed to query model list catalog: {e}")
        return {
            "models": [],
            "error": str(e)
        }

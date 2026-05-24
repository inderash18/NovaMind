import time
import uuid
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from backend.app.memory.persistence.db_session import get_db
from backend.app.memory.persistence.db_models import MemoryReference
from backend.app.memory.embeddings.embedder import embedder
from backend.app.memory.chroma.chromadb_backend import chroma_backend
from backend.app.memory.retrieval.retriever import retriever

logger = logging.getLogger("aetheros.memory.api.memories")
router = APIRouter()

# Pydantic schemas for validated memory payloads
class MemoryIndexSchema(BaseModel):
    session_id: str
    text: str
    workspace: Optional[str] = "default"
    importance_score: Optional[float] = 1.0

class MemorySearchResponse(BaseModel):
    id: str
    text: str
    similarity_score: float
    score: float
    metadata: Dict[str, Any]


@router.get("/search", response_model=List[MemorySearchResponse])
async def search_semantic_memories(
    query: str,
    session_id: Optional[str] = None,
    workspace: Optional[str] = "default",
    limit: Optional[int] = 5
):
    """
    Executes a hybrid semantic vector search over history nodes, returning similarity scores.
    """
    if not query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query parameter must be non-empty."
        )

    try:
        results = await retriever.retrieve_relevant_memories(
            session_id=session_id,
            query=query,
            limit=limit,
            workspace=workspace
        )
        
        # Serialize matching structures
        serialized = []
        for r in results:
            serialized.append(MemorySearchResponse(
                id=r["id"],
                text=r["text"],
                similarity_score=r["similarity_score"],
                score=r["score"],
                metadata=r["metadata"]
            ))
        return serialized
    except Exception as e:
        logger.error(f"Semantic search API failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query semantic memories: {str(e)}"
        )

@router.post("/index")
async def index_episodic_memory(payload: MemoryIndexSchema, db: AsyncSession = Depends(get_db)):
    """
    Manually indexes a technical note, task summary, or fact directly into vector memory.
    """
    if not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Memory text content must be non-empty."
        )

    try:
        memory_id = str(uuid.uuid4())
        # Generate semantic vector
        vector = await embedder.embed_query(payload.text)
        
        # Insert metadata descriptors
        metadata = {
            "session_id": payload.session_id,
            "scope": "manual",
            "workspace": payload.workspace,
            "timestamp": int(time.time()),
            "type": "episodic"
        }

        # 1. Store inside ChromaDB vector store
        add_success = await chroma_backend.add_memory(
            collection_name="aetheros_semantic_memory",
            id=memory_id,
            text=payload.text,
            embedding=vector,
            metadata=metadata
        )

        if not add_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to write semantic memory to vector store."
            )

        # 2. Store reference link in local SQL
        ref = MemoryReference(
            id=str(uuid.uuid4()),
            session_id=payload.session_id,
            vector_id=memory_id,
            text_chunk=payload.text,
            importance_score=payload.importance_score,
            workspace=payload.workspace
        )
        db.add(ref)
        await db.commit()
        
        return {
            "status": "success",
            "memory_id": memory_id,
            "message": "Episodic memory indexed into long-term vector store."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to index manual memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Memory index failed: {str(e)}"
        )

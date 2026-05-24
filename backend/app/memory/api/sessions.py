import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, Field

from backend.app.memory.persistence.db_session import get_db
from backend.app.memory.persistence.db_models import UserSession, Message

logger = logging.getLogger("aetheros.memory.api.sessions")
router = APIRouter()

# Pydantic schemas for validated request payloads
class SessionCreateSchema(BaseModel):
    id: str
    title: str
    model: str
    system_prompt: Optional[str] = None
    temperature: float = 0.7

class MessageResponseSchema(BaseModel):
    id: str
    role: str
    content: str
    reasoning: Optional[str] = None
    timestamp: float

    class Config:
        from_attributes = True

class SessionResponseSchema(BaseModel):
    id: str
    title: str
    model: str
    system_prompt: Optional[str] = None
    temperature: float
    created_at: float

    class Config:
        from_attributes = True


@router.get("", response_model=List[SessionResponseSchema])
async def list_user_sessions(db: AsyncSession = Depends(get_db)):
    """
    Returns a list of all historical user computational sessions.
    """
    try:
        query = select(UserSession).order_by(UserSession.created_at.desc())
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        # Serialize datetime keys to timestamps
        serialized = []
        for s in sessions:
            serialized.append(SessionResponseSchema(
                id=s.id,
                title=s.title,
                model=s.model,
                system_prompt=s.system_prompt,
                temperature=s.temperature,
                created_at=s.created_at.timestamp() * 1000.0
            ))
        return serialized
    except Exception as e:
        logger.error(f"Failed to list saved user sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load sessions: {str(e)}"
        )

@router.post("", response_model=SessionResponseSchema)
async def create_user_session(payload: SessionCreateSchema, db: AsyncSession = Depends(get_db)):
    """
    Saves a newly initialized terminal session into relational SQL database.
    """
    try:
        # Check duplicate
        query = select(UserSession).where(UserSession.id == payload.id)
        existing = (await db.execute(query)).scalar_one_or_none()
        if existing:
            return SessionResponseSchema(
                id=existing.id,
                title=existing.title,
                model=existing.model,
                system_prompt=existing.system_prompt,
                temperature=existing.temperature,
                created_at=existing.created_at.timestamp() * 1000.0
            )

        new_session = UserSession(
            id=payload.id,
            title=payload.title,
            model=payload.model,
            system_prompt=payload.system_prompt,
            temperature=payload.temperature
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        
        return SessionResponseSchema(
            id=new_session.id,
            title=new_session.title,
            model=new_session.model,
            system_prompt=new_session.system_prompt,
            temperature=new_session.temperature,
            created_at=new_session.created_at.timestamp() * 1000.0
        )
    except Exception as e:
        logger.error(f"Failed to create new user session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save session: {str(e)}"
        )

@router.get("/{id}/messages", response_model=List[MessageResponseSchema])
async def list_session_messages(id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns full rolling history of conversational dialogue turns within a session.
    """
    try:
        query = select(Message).where(Message.session_id == id).order_by(Message.timestamp.asc())
        result = await db.execute(query)
        messages = result.scalars().all()
        
        serialized = []
        for m in messages:
            serialized.append(MessageResponseSchema(
                id=m.id,
                role=m.role,
                content=m.content,
                reasoning=m.reasoning,
                timestamp=m.timestamp.timestamp() * 1000.0
            ))
        return serialized
    except Exception as e:
        logger.error(f"Failed to retrieve messages list for session {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load messages: {str(e)}"
        )

@router.delete("/{id}")
async def delete_user_session(id: str, db: AsyncSession = Depends(get_db)):
    """
    Destroys session details and cascadingly prunes all messages.
    """
    try:
        query = select(UserSession).where(UserSession.id == id)
        session = (await db.execute(query)).scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session with ID {id} not found."
            )
            
        await db.delete(session)
        await db.commit()
        return {"status": "success", "message": f"Session {id} and messages deleted."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )

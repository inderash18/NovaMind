from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import relationship

from backend.app.memory.persistence.db_session import Base

class UserSession(Base):
    """
    UserSession stores structural conversational state boundaries.
    """
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, default="New AI Session")
    model = Column(String, nullable=False)
    system_prompt = Column(Text, nullable=True)
    temperature = Column(Float, nullable=False, default=0.7)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", lazy="selectin")
    memories = relationship("MemoryReference", back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    """
    Message records every conversational prompt and generated assistant completion.
    """
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("user_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=True)  # DeepSeek Chain-of-Thought reasoning
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    tokens_count = Column(Integer, nullable=True)

    # Relationships
    session = relationship("UserSession", back_populates="messages")


class WorkspaceContext(Base):
    """
    WorkspaceContext configures project workspace directories and isolation parameters.
    """
    __tablename__ = "workspace_contexts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    meta_config = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class MemoryReference(Base):
    """
    MemoryReference links a specific conversation turn to its semantic vector coordinate inside ChromaDB.
    """
    __tablename__ = "memory_references"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("user_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    vector_id = Column(String, nullable=False, unique=True, index=True)  # ChromaDB record ID
    text_chunk = Column(Text, nullable=False)
    importance_score = Column(Float, nullable=True, default=1.0)
    workspace = Column(String, nullable=True, default="default")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("UserSession", back_populates="memories")

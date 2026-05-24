import time
from enum import Enum
from typing import Optional, Any, Dict, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class WSMessageType(str, Enum):
    CHAT_START = "chat.start"
    CHAT_TOKEN = "chat.token"
    CHAT_THINKING = "chat.thinking"
    CHAT_TOOL_CALL = "chat.tool_call"
    CHAT_TOOL_RESULT = "chat.tool_result"
    CHAT_DONE = "chat.done"
    CHAT_ERROR = "chat.error"
    
    SYSTEM_VRAM = "system.vram"
    SYSTEM_PROVIDER_HEALTH = "system.provider_health"

class WSMessage(BaseModel, Generic[T]):
    """
    Standard WebSocket message envelope used across all channels.
    Matches the frontend TypeScript specification.
    """
    id: str = Field(..., description="Unique UUID to correlate client request and server response streams")
    type: WSMessageType
    session: str = Field(..., description="Active session ID key")
    timestamp: int = Field(default_factory=lambda: int(time.time() * 1000.0))
    payload: T

class ChatStartPayload(BaseModel):
    prompt: str
    model: str
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2048
    extra_params: Dict[str, Any] = Field(default_factory=dict)

class ChatTokenPayload(BaseModel):
    token: str

class ChatThinkingPayload(BaseModel):
    token: str

class ChatDonePayload(BaseModel):
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_time_ms: float = 0.0

class ChatErrorPayload(BaseModel):
    message: str
    retry_allowed: bool = True
    error_code: Optional[str] = None

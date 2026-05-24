from abc import ABC, abstractmethod
from enum import Enum
from typing import AsyncIterator, List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProviderStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    OFFLINE = "offline"

class ProviderHealth(BaseModel):
    status: ProviderStatus
    latency_ms: float = 0.0
    available_models: List[str] = Field(default_factory=list)
    vram_free_mb: float = 0.0
    error_message: Optional[str] = None

class GenerateRequest(BaseModel):
    model: str
    prompt: str
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2048
    stop: Optional[List[str]] = None
    extra_params: Dict[str, Any] = Field(default_factory=dict)

class GenerateChunk(BaseModel):
    token: str = ""
    thinking_token: Optional[str] = None  # reasoning/thinking token for CoT model displays
    is_final: bool = False
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None

class ModelInfo(BaseModel):
    id: str
    name: str
    size_bytes: Optional[int] = None
    quantization: Optional[str] = None
    vram_required_mb: Optional[float] = None
    details: Dict[str, Any] = Field(default_factory=dict)

class ProviderConfig(BaseModel):
    name: str
    endpoint: str
    priority: int
    enabled: bool = True

class BaseProvider(ABC):
    """
    Every AetherOS inference provider MUST implement this contract.
    Ensures complete interoperability across Ollama, LM Studio, llama.cpp, vLLM, etc.
    """

    def __init__(self, config: ProviderConfig):
        self.config = config

    @abstractmethod
    async def health_check(self) -> ProviderHealth:
        """
        Executes a rapid provider diagnostic.
        Must complete within 5 seconds.
        Must NEVER raise an unhandled exception (return ProviderHealth(status=OFFLINE) on error).
        """
        pass

    @abstractmethod
    async def generate(self, request: GenerateRequest) -> AsyncIterator[GenerateChunk]:
        """
        Token-streaming generator.
        Yields GenerateChunk tokens as they arrive.
        Must propagate cancellation via standard asyncio.CancelledError.
        """
        pass

    @abstractmethod
    async def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Generates local embeddings. No cloud dependencies.
        """
        pass

    @abstractmethod
    async def list_models(self) -> List[ModelInfo]:
        """
        Returns a list of all models currently registered/cached in this provider.
        """
        pass

    @abstractmethod
    async def load_model(self, model_id: str) -> bool:
        """
        Instructs the provider runtime to pull or prime a model in VRAM.
        Returns True on success, False otherwise.
        """
        pass

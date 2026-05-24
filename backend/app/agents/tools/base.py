from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ToolParameter(BaseModel):
    name: str
    type: str  # 'string', 'number', 'boolean', 'array', 'object'
    description: str
    required: bool = True
    default: Optional[Any] = None

class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: List[ToolParameter] = Field(default_factory=list)

class ToolResult(BaseModel):
    """
    Standardized tool execution output envelope.
    Ensures structural logging and clean parsing.
    """
    success: bool
    output: str
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class BaseTool(ABC):
    """
    Abstract Base Class for all AetherOS Agentic executable capabilities.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @property
    @abstractmethod
    def definition(self) -> ToolDefinition:
        pass

    @abstractmethod
    async def execute(self, args: Dict[str, Any], context: Dict[str, Any]) -> ToolResult:
        """
        Executes the tool's runtime capability.
        Must be asynchronous and non-blocking.
        """
        pass

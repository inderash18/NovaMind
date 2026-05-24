import logging
from typing import Dict, List, Any, Optional
import os
import aiofiles

from backend.app.agents.tools.base import BaseTool, ToolDefinition, ToolResult, ToolParameter

logger = logging.getLogger("aetheros.agents.tools.registry")

class ToolRegistry:
    """
    ToolRegistry registers and brokers all tool execution requests,
    validating input parameters prior to runtime dispatch.
    """

    def __init__(self):
        self.tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def register_tool(self, tool: BaseTool):
        if tool.name in self.tools:
            logger.warning(f"Overwriting registered tool: {tool.name}")
        self.tools[tool.name] = tool
        logger.info(f"Registered agent tool: {tool.name}")

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self.tools.get(name)

    def list_tools(self) -> List[ToolDefinition]:
        return [t.definition for t in self.tools.values()]

    async def execute_tool(self, name: str, args: Dict[str, Any], context: Dict[str, Any]) -> ToolResult:
        """
        Executes a registered tool after strict parameters checks.
        """
        tool = self.get_tool(name)
        if not tool:
            return ToolResult(
                success=False,
                output="",
                error=f"Unrecognized tool: '{name}'"
            )

        # Schema Validation checks
        try:
            validated_args = self._validate_args(tool.definition, args)
        except ValueError as ve:
            logger.warning(f"Tool {name} arguments validation failed: {ve}")
            return ToolResult(
                success=False,
                output="",
                error=f"Arguments validation error: {str(ve)}"
            )

        # Route tool execution
        try:
            return await tool.execute(validated_args, context)
        except Exception as e:
            logger.error(f"Execution crashed inside tool {name}: {e}")
            return ToolResult(
                success=False,
                output="",
                error=f"Runtime Exception: {str(e)}"
            )

    def _validate_args(self, definition: ToolDefinition, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates input arguments types and defaults against schemas.
        """
        validated = {}
        param_map = {p.name: p for p in definition.parameters}

        # Check required fields
        for name, param in param_map.items():
            if param.required and name not in args:
                raise ValueError(f"Missing required parameter: '{name}'")

        # Map and type-check
        for name, val in args.items():
            if name not in param_map:
                # Ignore unregistered extra parameters
                continue
                
            param = param_map[name]
            
            # Cast / check type boundaries
            if param.type == "string" and not isinstance(val, str):
                val = str(val)
            elif param.type == "number" and not isinstance(val, (int, float)):
                val = float(val)
            elif param.type == "boolean" and not isinstance(val, bool):
                val = bool(val)
                
            validated[name] = val

        # Populate defaults
        for name, param in param_map.items():
            if name not in validated and param.default is not None:
                validated[name] = param.default

        return validated

    def _register_default_tools(self):
        # Register default filesystem tools
        self.register_tool(ReadFileTool())
        self.register_tool(WriteFileTool())
        self.register_tool(ListDirectoryTool())


# ========================================================
# DEFAULT FILE SYSTEM TOOLS IMPLEMENTATIONS
# ========================================================

class ReadFileTool(BaseTool):
    @property
    def name(self) -> str:
        return "read_file"

    @property
    def description(self) -> str:
        return "Reads the absolute text content of a safe file in the isolated workspace."

    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name=self.name,
            description=self.description,
            parameters=[
                ToolParameter(
                    name="path",
                    type="string",
                    description="The workspace relative path of the target file to read."
                )
            ]
        )

    async def execute(self, args: Dict[str, Any], context: Dict[str, Any]) -> ToolResult:
        rel_path = args["path"]
        # Scrub prefix directory climbing (directory escape protection)
        sanitized_path = os.path.normpath(rel_path).lstrip("/\\")
        
        # Pull sandboxed path root from execution context
        workspace_root = context.get("workspace_root", "./data/scratch")
        target_abs_path = os.path.join(workspace_root, sanitized_path)

        # Boundary checks
        if not os.path.abspath(target_abs_path).startswith(os.path.abspath(workspace_root)):
            return ToolResult(
                success=False,
                output="",
                error="Security Violation: Cannot access folders outside isolated workspace boundary."
            )

        if not os.path.exists(target_abs_path):
            return ToolResult(
                success=False,
                output="",
                error=f"File not found: '{rel_path}'"
            )

        try:
            async with aiofiles.open(target_abs_path, mode="r", encoding="utf-8") as f:
                content = await f.read()
            return ToolResult(
                success=True,
                output=content,
                metadata={"file_size_bytes": len(content)}
            )
        except Exception as e:
            return ToolResult(success=False, output="", error=str(e))


class WriteFileTool(BaseTool):
    @property
    def name(self) -> str:
        return "write_file"

    @property
    def description(self) -> str:
        return "Writes or overwrites text contents inside a safe file in the isolated workspace."

    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name=self.name,
            description=self.description,
            parameters=[
                ToolParameter(
                    name="path",
                    type="string",
                    description="The workspace relative path of the file to write."
                ),
                ToolParameter(
                    name="content",
                    type="string",
                    description="The complete text content to write into the file."
                )
            ]
        )

    async def execute(self, args: Dict[str, Any], context: Dict[str, Any]) -> ToolResult:
        rel_path = args["path"]
        content = args["content"]
        
        sanitized_path = os.path.normpath(rel_path).lstrip("/\\")
        workspace_root = context.get("workspace_root", "./data/scratch")
        target_abs_path = os.path.join(workspace_root, sanitized_path)

        # Boundary checks
        if not os.path.abspath(target_abs_path).startswith(os.path.abspath(workspace_root)):
            return ToolResult(
                success=False,
                output="",
                error="Security Violation: Cannot write outside isolated workspace boundary."
            )

        try:
            # Auto make directories
            os.makedirs(os.path.dirname(target_abs_path), exist_ok=True)
            async with aiofiles.open(target_abs_path, mode="w", encoding="utf-8") as f:
                await f.write(content)
            return ToolResult(
                success=True,
                output=f"Successfully committed {len(content)} characters to '{rel_path}'.",
                metadata={"file_size_bytes": len(content)}
            )
        except Exception as e:
            return ToolResult(success=False, output="", error=str(e))


class ListDirectoryTool(BaseTool):
    @property
    def name(self) -> str:
        return "list_directory"

    @property
    def description(self) -> str:
        return "Lists files and subdirectories inside the isolated workspace directory."

    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name=self.name,
            description=self.description,
            parameters=[
                ToolParameter(
                    name="path",
                    type="string",
                    description="The workspace relative path to list. Empty string lists root.",
                    required=False,
                    default=""
                )
            ]
        )

    async def execute(self, args: Dict[str, Any], context: Dict[str, Any]) -> ToolResult:
        rel_path = args.get("path", "")
        sanitized_path = os.path.normpath(rel_path).lstrip("/\\")
        workspace_root = context.get("workspace_root", "./data/scratch")
        target_abs_path = os.path.join(workspace_root, sanitized_path)

        if not os.path.abspath(target_abs_path).startswith(os.path.abspath(workspace_root)):
            return ToolResult(
                success=False,
                output="",
                error="Security Violation: Cannot list folders outside workspace boundaries."
            )

        if not os.path.exists(target_abs_path):
            return ToolResult(
                success=False,
                output="",
                error=f"Directory not found: '{rel_path}'"
            )

        try:
            files_list = []
            for item in os.listdir(target_abs_path):
                item_abs = os.path.join(target_abs_path, item)
                files_list.append({
                    "name": item,
                    "is_dir": os.path.isdir(item_abs),
                    "size_bytes": os.path.getsize(item_abs) if os.path.isfile(item_abs) else None
                })
            
            import json
            return ToolResult(
                success=True,
                output=json.dumps(files_list, indent=2),
                metadata={"items_count": len(files_list)}
            )
        except Exception as e:
            return ToolResult(success=False, output="", error=str(e))


# Central Singleton Instance
tool_registry = ToolRegistry()

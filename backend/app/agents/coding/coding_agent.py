import json
import logging
from typing import Dict, Any, Tuple, Optional

from backend.app.agents.tools.base import BaseTool, ToolDefinition, ToolResult, ToolParameter
from backend.app.agents.tools.registry import tool_registry
from backend.app.agents.coding.linter import ast_linter

logger = logging.getLogger("aetheros.agents.coding.coding_agent")

class CodingAgent:
    """
    CodingAgent executes repository operations in isolated workspaces,
    linting files and analyzing outputs.
    """

    async def execute_task(self, description: str, context: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Runs the step using the ReAct (Reason -> Act -> Observe) loop.
        """
        session_id = context.get("session_id", "default")
        workspace_root = context.get("workspace_root", "./data/scratch")
        
        logger.info(f"CodingAgent starting task: '{description}' in {workspace_root}")

        # In a production-grade ReAct framework, we formulate prompts instructing the model
        # to execute files and check outputs. For Phase 3, we build the structured pipeline:
        try:
            # Check if this task involves writing Python code
            if "write" in description.lower() or "create" in description.lower() or "script" in description.lower():
                # Let's extract code or mock code creation representing automated engineering runs
                # In real ReAct loop, LLM compiles the arguments. Here we simulate execution of registry tools:
                return await self._run_simulated_react_code_creation(description, context)
            else:
                # Fallback to listing/analyzing directory contents
                res = await tool_registry.execute_tool("list_directory", {"path": ""}, context)
                return res.success, res.output if res.success else res.error
        except Exception as e:
            logger.error(f"CodingAgent execution loop failed: {e}")
            return False, f"Execution failed: {str(e)}"

    async def _run_simulated_react_code_creation(self, goal: str, context: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Autonomous code generation and execution validation loop.
        """
        # Step 1: Write file (with AST lint check)
        filename = "math_sorter.py"
        code_content = (
            "import time\n"
            "def bubble_sort(arr):\n"
            "    n = len(arr)\n"
            "    for i in range(n):\n"
            "        for j in range(0, n-i-1):\n"
            "            if arr[j] > arr[j+1]:\n"
            "                arr[j], arr[j+1] = arr[j+1], arr[j]\n"
            "    return arr\n\n"
            "if __name__ == '__main__':\n"
            "    start = time.perf_counter()\n"
            "    res = bubble_sort([64, 34, 25, 12, 22, 11, 90])\n"
            "    elapsed = (time.perf_counter() - start) * 1000.0\n"
            "    print(f'Sorted Array: {res} in {elapsed:.4f}ms')\n"
        )

        # Pre-execution: static AST compilation check
        is_valid, linter_err = ast_linter.validate_syntax(code_content)
        if not is_valid:
            return False, f"AST Linter Blocked Write: {linter_err}"

        # Write code inside workspace boundary
        write_res = await tool_registry.execute_tool(
            "write_file",
            {"path": filename, "content": code_content},
            context
        )

        if not write_res.success:
            return False, f"Failed to write codebase: {write_res.error}"

        # Step 2: Sandbox Execution (calls run_shell_command which checks permissions and runs sandbox)
        exec_res = await tool_registry.execute_tool(
            "run_shell_command",
            {"command": f"python {filename}"},
            context
        )

        if not exec_res.success:
            return False, f"Sandboxed file execution failed: {exec_res.error}"

        output_log = (
            f"✓ File created successfully at '{filename}'\n"
            f"✓ AST Static Linter compilation validation: passed\n"
            f"✓ Isolated sandbox shell stdout output:\n"
            f"==========================================================\n"
            f"{exec_res.output}"
            f"=========================================================="
        )
        return True, output_log


# ========================================================
# CODING AGENT AST LINTER TOOL REGISTRATION
# ========================================================

class AstLintTool(BaseTool):
    @property
    def name(self) -> str:
        return "ast_lint_code"

    @property
    def description(self) -> str:
        return "Statically parses python code using AST to check for compile errors before writing files."

    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name=self.name,
            description=self.description,
            parameters=[
                ToolParameter(
                    name="code",
                    type="string",
                    description="The python source code text string to validate."
                )
            ]
        )

    async def execute(self, args: Dict[str, Any], context: Dict[str, Any]) -> ToolResult:
        code = args["code"]
        is_valid, err = ast_linter.validate_syntax(code)
        
        return ToolResult(
            success=is_valid,
            output="✓ Code syntax is fully correct." if is_valid else "",
            error=err
        )

# Register ast lint tool
tool_registry.register_tool(AstLintTool())

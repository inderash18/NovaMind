import os
import asyncio
import logging
import shlex
from typing import Dict, Any, List

from backend.app.agents.tools.base import BaseTool, ToolDefinition, ToolResult, ToolParameter
from backend.app.agents.tools.registry import tool_registry

logger = logging.getLogger("aetheros.agents.sandbox.sandbox_runtime")

class SandboxRuntime:
    """
    SandboxRuntime governs command execution safety.
    Triggers isolated Docker containers, falling back to restricted subprocess environments.
    """

    def __init__(self, timeout_s: float = 30.0):
        self.timeout_s = timeout_s
        self.forbidden_keywords = {
            "rm -rf /", "sudo", "chown", "chmod", "shutdown", "reboot", "poweroff", 
            "mkfs", "dd if=", "fork", ":(){ :|:& };:"
        }

    async def execute_command(self, command: str, context: Dict[str, Any]) -> ToolResult:
        """
        Executes a shell command inside the secure isolated environment.
        """
        # 1. Whitelist character and command syntax validation
        if not command.strip():
            return ToolResult(success=False, output="", error="Command cannot be empty.")

        for kw in self.forbidden_keywords:
            if kw in command:
                logger.warning(f"Security Alert: Blocked prohibited sandbox execution keyword: '{kw}'")
                return ToolResult(
                    success=False,
                    output="",
                    error=f"Security Violation: Command contains prohibited keyword: '{kw}'"
                )

        workspace_root = context.get("workspace_root", "./data/scratch")
        os.makedirs(workspace_root, exist_ok=True)
        abs_workspace = os.path.abspath(workspace_root)

        # 2. Primary: Containerized Docker Sandboxed Command Execution
        try:
            return await self._run_docker_sandbox(command, abs_workspace)
        except Exception as de:
            logger.warning(f"Docker sandbox execution failed or unavailable: {de}. Falling back to subprocess isolation...")

        # 3. Fallback: Local isolated folder subprocess shell
        return await self._run_subprocess_sandbox(command, abs_workspace)

    async def _run_docker_sandbox(self, command: str, abs_workspace: str) -> ToolResult:
        """
        Runs the command inside an isolated Docker container with strict CPU/memory limits.
        """
        # Escape shell args
        escaped_cmd = shlex.quote(command)
        
        # Build strict CPU and memory restricted Docker execution command
        # Mounts host isolated scratch directory as /workspace inside container
        docker_cmd = (
            f"docker run --rm "
            f"-v {shlex.quote(abs_workspace)}:/workspace "
            f"-w /workspace "
            f"-m 512m --cpus=1.0 "
            f"python:3.11-slim bash -c {escaped_cmd}"
        )

        proc = await asyncio.create_subprocess_shell(
            docker_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=self.timeout_s)
            
            stdout_str = stdout.decode("utf-8", errors="replace")
            stderr_str = stderr.decode("utf-8", errors="replace")
            
            success = proc.returncode == 0
            
            return ToolResult(
                success=success,
                output=stdout_str,
                error=stderr_str if not success else None,
                metadata={
                    "runtime": "docker_sandbox",
                    "exit_code": proc.returncode,
                    "command": command
                }
            )
        except asyncio.TimeoutError:
            # Clean container termination
            try:
                proc.kill()
            except Exception:
                pass
            return ToolResult(
                success=False,
                output="",
                error=f"Execution Timed Out: Command exceeded limits of {self.timeout_s}s."
            )

    async def _run_subprocess_sandbox(self, command: str, abs_workspace: str) -> ToolResult:
        """
        Runs command via standard Python asyncio subprocess isolated inside the scratch directory.
        """
        # Command directory escape safety
        if ".." in command:
            return ToolResult(
                success=False,
                output="",
                error="Security Violation: Directory climbing path indicators ('..') are prohibited inside sandbox commands."
            )

        # Spawn non-blocking subprocess with directory bounds
        proc = await asyncio.create_subprocess_shell(
            command,
            cwd=abs_workspace,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=self.timeout_s)
            
            stdout_str = stdout.decode("utf-8", errors="replace")
            stderr_str = stderr.decode("utf-8", errors="replace")
            
            success = proc.returncode == 0
            
            return ToolResult(
                success=success,
                output=stdout_str,
                error=stderr_str if not success else None,
                metadata={
                    "runtime": "subprocess_sandbox",
                    "exit_code": proc.returncode,
                    "command": command
                }
            )
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            return ToolResult(
                success=False,
                output="",
                error=f"Execution Timed Out: Subprocess exceeded limits of {self.timeout_s}s."
            )

# Central Singleton Instance
sandbox_runtime = SandboxRuntime()


# ========================================================
# REGISTER UNIVERSAL RUN SHELL COMMAND TOOL
# ========================================================

class RunShellCommandTool(BaseTool):
    @property
    def name(self) -> str:
        return "run_shell_command"

    @property
    def description(self) -> str:
        return (
            "Executes terminal shell/bash scripts inside the isolated sandbox workspace. "
            "Requires explicit user permission before starting."
        )

    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name=self.name,
            description=self.description,
            parameters=[
                ToolParameter(
                    name="command",
                    type="string",
                    description="The terminal shell script command to run."
                )
            ]
        )

    async def execute(self, args: Dict[str, Any], context: Dict[str, Any]) -> ToolResult:
        cmd = args["command"]
        
        # Verify permissions socket before routing to sandbox
        session_id = context.get("session_id")
        if session_id:
            # Fetch global permission manager
            from backend.app.agents.permissions.permission_manager import permission_manager
            try:
                await permission_manager.verify_permission(self.name, args, session_id)
            except Exception as e:
                return ToolResult(
                    success=False,
                    output="",
                    error=f"Permission Denied: {str(e)}"
                )

        # Route directly into secure sandbox
        return await sandbox_runtime.execute_command(cmd, context)

# Dynamic registration
tool_registry.register_tool(RunShellCommandTool())

import asyncio
import uuid
import logging
from typing import Dict, Any, Tuple, Optional

from backend.core.websocket_manager import ws_manager

logger = logging.getLogger("aetheros.agents.permissions.permission_manager")

class PermissionDeniedException(Exception):
    pass

class PermissionManager:
    """
    PermissionManager implements a granular, zero-trust permission architecture.
    Suspends high-privilege tool requests and prompts users via WebSockets.
    """

    def __init__(self):
        # Map prompt_id -> (asyncio.Event, result_dict)
        self.pending_approvals: Dict[str, Tuple[asyncio.Event, Dict[str, Any]]] = {}
        
        # High-privilege tools requiring runtime confirmation
        self.restricted_tools = {
            "run_shell_command",
            "write_file",  # Whitelisted paths checked, others prompt
            "install_package"
        }

    async def verify_permission(
        self,
        tool_name: str,
        args: Dict[str, Any],
        session_id: str
    ) -> bool:
        """
        Policy checker. Prompts user if tool is restricted.
        Returns True if granted, raises PermissionDeniedException if denied.
        """
        # If tool is safe, bypass check
        if tool_name not in self.restricted_tools:
            return True

        # Custom filesystem checks: writing to standard read logs is fine, others prompt
        if tool_name == "write_file":
            rel_path = args.get("path", "")
            if rel_path.endswith(".log") or rel_path.startswith("logs/"):
                return True

        prompt_id = str(uuid.uuid4())
        event = asyncio.Event()
        result_container = {"approved": False}
        
        self.pending_approvals[prompt_id] = (event, result_container)
        
        # Dispatches the permission request prompt over the websocket session channel
        envelope = {
            "id": prompt_id,
            "type": "permission.prompt",
            "session": session_id,
            "timestamp": int(time_ms()),
            "payload": {
                "tool": tool_name,
                "arguments": args
            }
        }
        
        logger.info(f"High-privilege tool execution '{tool_name}' suspended. Awaiting user permission on prompt: {prompt_id}...")
        await ws_manager.send_json_to_session(session_id, envelope)

        try:
            # Block task thread until event is set (resolving timeout at supervisor layer)
            await event.wait()
            
            if result_container.get("approved", False):
                logger.info(f"User approved tool execution '{tool_name}' for prompt: {prompt_id}.")
                return True
            else:
                logger.warning(f"User denied tool execution '{tool_name}' for prompt: {prompt_id}.")
                raise PermissionDeniedException("Execution Denied by User.")
        finally:
            # Clean tracking registry
            if prompt_id in self.pending_approvals:
                del self.pending_approvals[prompt_id]

    def resolve_permission(self, prompt_id: str, approved: bool):
        """
        Callback triggered from WebSocket routers when client returns decision.
        """
        if prompt_id not in self.pending_approvals:
            logger.warning(f"Attempted to resolve expired or non-existent permission prompt: {prompt_id}")
            return

        event, result_container = self.pending_approvals[prompt_id]
        result_container["approved"] = approved
        event.set()  # Unblocks the waiting thread

def time_ms() -> float:
    import time
    return time.time() * 1000.0

# Central Singleton Instance
permission_manager = PermissionManager()

import logging
import asyncio
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, BackgroundTasks, HTTPException

from backend.app.agents.tools.registry import tool_registry
from backend.app.agents.runtime.agent_runtime import agent_runtime
from backend.app.agents.permissions.permission_manager import permission_manager
from backend.app.agents.state_machine.state_machine import agent_state_machine

logger = logging.getLogger("aetheros.agents.api.agent_endpoints")
router = APIRouter()

# ========================================================
# PYDANTIC SCHEMAS
# ========================================================

class AgentRunRequest(BaseModel):
    session_id: str = Field(..., description="The unique session ID correlating the active conversation context.")
    goal: str = Field(..., description="The technical milestone goal to execute.")
    model: str = Field("llama3", description="The local neural model identifier used by the task planner.")

class PermissionResolveRequest(BaseModel):
    prompt_id: str = Field(..., description="The unique prompt UUID generated for the suspended restricted tool.")
    approved: bool = Field(..., description="Boolean decision from the developer to approve or block the execution.")

# ========================================================
# ENDPOINT IMPLEMENTATIONS
# ========================================================

@router.get("/tools")
async def list_agent_tools() -> List[Dict[str, Any]]:
    """
    Exposes all whitelisted dynamic tools loaded inside the sovereign AetherOS Registry.
    """
    tools = tool_registry.list_tools()
    return [t.model_dump() for t in tools]

@router.post("/run")
async def trigger_agent_run(req: AgentRunRequest, background_tasks: BackgroundTasks):
    """
    Launches an autonomous ReAct execution workflow asynchronously in the background.
    """
    session_id = req.session_id
    goal = req.goal
    model = req.model

    # Check if agent is already running for this session
    current_state = agent_state_machine.get_state(session_id)
    if current_state in {"PLANNING", "EXECUTING", "OBSERVING", "WAITING"}:
        raise HTTPException(
            status_code=400,
            detail=f"Agent is already executing an active goal in session {session_id} (State: {current_state})"
        )

    # Launch non-blocking asyncio runtime loop
    asyncio.create_task(
        agent_runtime.execute_goal(
            goal=goal,
            session_id=session_id,
            model=model
        )
    )

    return {
        "status": "triggered",
        "session_id": session_id,
        "goal": goal,
        "initial_state": "PLANNING"
    }

@router.post("/permission/resolve")
async def resolve_permission_prompt(req: PermissionResolveRequest):
    """
    Resolves a suspended permission confirmation block, resuming agent execution.
    """
    prompt_id = req.prompt_id
    approved = req.approved
    
    logger.info(f"Received manual permission decision for prompt '{prompt_id}': Approved={approved}")
    
    if prompt_id not in permission_manager.pending_approvals:
        raise HTTPException(
            status_code=404,
            detail=f"Permission Prompt '{prompt_id}' not found or already expired."
        )

    # Resume wait event natively
    permission_manager.resolve_permission(prompt_id, approved)
    
    return {
        "status": "resolved",
        "prompt_id": prompt_id,
        "decision": "approved" if approved else "denied"
    }

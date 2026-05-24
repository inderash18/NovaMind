import logging
import asyncio
from typing import Dict, Any, Callable, Awaitable

from backend.app.agents.state_machine.state_machine import agent_state_machine, AgentState

logger = logging.getLogger("aetheros.agents.supervisor.supervisor")

class MaxStepsExceededException(Exception):
    pass

class LoopSupervisor:
    """
    LoopSupervisor monitors active ReAct agent execution cycles.
    Protects threads against infinite tool loops, executes backoff recovery,
    and governs agent status transitions during exceptions.
    """

    def __init__(self, max_steps: int = 15, base_delay_s: float = 1.0):
        self.max_steps = max_steps
        self.base_delay_s = base_delay_s
        # Map session_id -> step_counter
        self.session_steps: Dict[str, int] = {}

    def reset_steps(self, session_id: str):
        self.session_steps[session_id] = 0
        logger.info(f"Reset step counter for session {session_id}.")

    def increment_and_verify(self, session_id: str) -> int:
        """
        Increments step count and monitors loop bounds.
        Raises MaxStepsExceededException if threshold is crossed.
        """
        current_steps = self.session_steps.get(session_id, 0) + 1
        self.session_steps[session_id] = current_steps
        
        logger.info(f"ReAct Loop step check - Session: {session_id} | Step: {current_steps}/{self.max_steps}")
        
        if current_steps > self.max_steps:
            logger.error(f"Infinite loop hazard detected! Session {session_id} exceeded limit of {self.max_steps} steps.")
            raise MaxStepsExceededException(f"Execution aborted. Maximum ReAct steps count ({self.max_steps}) exceeded.")
            
        return current_steps

    async def run_with_retry(
        self,
        session_id: str,
        operation: Callable[[], Awaitable[Any]],
        max_retries: int = 3
    ) -> Any:
        """
        Robust supervisor wrapper executing code with transient backoff retries.
        Automatically switches states to RETRYING and raises if exhausted.
        """
        attempt = 0
        while attempt < max_retries:
            try:
                return await operation()
            except Exception as e:
                attempt += 1
                logger.warning(
                    f"Transient failure in session {session_id} on attempt {attempt}/{max_retries}: {e}"
                )
                
                if attempt >= max_retries:
                    logger.error(f"Execution retries completely exhausted for session {session_id}.")
                    raise e
                
                # Switch machine state to notify client
                await agent_state_machine.transition_to(session_id, AgentState.RETRYING)
                
                # Exponential backoff delay
                delay = self.base_delay_s * (2 ** (attempt - 1))
                logger.info(f"Applying supervisor exponential backoff: sleeping for {delay:.2f} seconds...")
                await asyncio.sleep(delay)
                
                # Reset back to executing state
                await agent_state_machine.transition_to(session_id, AgentState.EXECUTING)

# Central Singleton Instance
loop_supervisor = LoopSupervisor()

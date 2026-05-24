import logging
from enum import Enum
from typing import Dict, Set

from backend.core.websocket_manager import ws_manager

logger = logging.getLogger("aetheros.agents.state_machine.state_machine")

class AgentState(str, Enum):
    IDLE = "IDLE"
    PLANNING = "PLANNING"
    EXECUTING = "EXECUTING"
    OBSERVING = "OBSERVING"
    WAITING = "WAITING"  # Blocked awaiting permission approval
    RETRYING = "RETRYING"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"

class AgentStateMachine:
    """
    AgentStateMachine coordinates execution status transitions,
    broadcasting status frames to Next.js clients over WebSockets.
    """

    def __init__(self):
        # Map session_id -> current AgentState
        self.session_states: Dict[str, AgentState] = {}
        
        # Valid state transitions graph
        self.allowed_transitions: Dict[AgentState, Set[AgentState]] = {
            AgentState.IDLE: {AgentState.PLANNING},
            AgentState.PLANNING: {AgentState.EXECUTING, AgentState.FAILED},
            AgentState.EXECUTING: {AgentState.OBSERVING, AgentState.WAITING, AgentState.FAILED, AgentState.COMPLETED},
            AgentState.OBSERVING: {AgentState.EXECUTING, AgentState.WAITING, AgentState.COMPLETED, AgentState.FAILED},
            AgentState.WAITING: {AgentState.EXECUTING, AgentState.OBSERVING, AgentState.FAILED},
            AgentState.RETRYING: {AgentState.EXECUTING, AgentState.FAILED},
            AgentState.FAILED: {AgentState.PLANNING, AgentState.IDLE},
            AgentState.COMPLETED: {AgentState.PLANNING, AgentState.IDLE}
        }

    def get_state(self, session_id: str) -> AgentState:
        return self.session_states.get(session_id, AgentState.IDLE)

    async def transition_to(self, session_id: str, new_state: AgentState) -> bool:
        """
        Transitions the session status and broadcasts the update.
        """
        current = self.get_state(session_id)
        
        # Validate transition bounds
        if new_state not in self.allowed_transitions[current]:
            # Degraded safety check: Force transition but print warnings
            logger.warning(f"Illegal state transition requested for {session_id}: {current.value} -> {new_state.value}. Overriding for stability.")

        self.session_states[session_id] = new_state
        logger.info(f"Session {session_id} agent state transitioned: {current.value} -> {new_state.value}")

        # Broadcast state change over WebSockets session channel
        envelope = {
            "id": f"state_{session_id}",
            "type": "agent.status",
            "session": session_id,
            "timestamp": self._time_ms(),
            "payload": {
                "state": new_state.value,
                "previous_state": current.value
            }
        }
        await ws_manager.send_json_to_session(session_id, envelope)
        return True

    def _time_ms(self) -> float:
        import time
        return time.time() * 1000.0

# Central Singleton Instance
agent_state_machine = AgentStateMachine()

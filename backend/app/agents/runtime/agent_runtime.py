import logging
import asyncio
import uuid
import time
from typing import Dict, Any, List, Optional

from backend.app.agents.planner.task_planner import task_planner
from backend.app.agents.state_machine.state_machine import agent_state_machine, AgentState
from backend.app.agents.supervisor.supervisor import loop_supervisor
from backend.app.agents.coding.coding_agent import CodingAgent
from backend.app.agents.browser.browser_agent import BrowserAgent
from backend.core.websocket_manager import ws_manager

logger = logging.getLogger("aetheros.agents.runtime.agent_runtime")

class AgentRuntime:
    """
    AgentRuntime is the central ReAct core runtime loop orchestrator.
    It compiles goals into executable Directed Acyclic Graphs (DAG),
    schedules sub-tasks, dispatches them to specialized agent execution channels,
    and streams holographic state logs to Next.js clients.
    """

    def __init__(self):
        self.coding_agent = CodingAgent()
        self.browser_agent = BrowserAgent()

    async def execute_goal(
        self,
        goal: str,
        session_id: str,
        model: str,
        workspace_root: str = "./data/scratch"
    ) -> bool:
        """
        Executes a high-level developer goal by planning it into a DAG,
        broadcasting updates, and executing tasks using ReAct steps.
        """
        context = {
            "session_id": session_id,
            "workspace_root": workspace_root
        }

        # 1. Transition state to PLANNING
        await agent_state_machine.transition_to(session_id, AgentState.PLANNING)
        await self._broadcast_log(session_id, "thought", f"Decomposing developer goal: '{goal}' into structured DAG task steps...")

        # 2. Decompose Goal via TaskPlanner
        try:
            tasks = await task_planner.plan_goal(goal, model)
            logger.info(f"TaskPlanner generated {len(tasks)} sub-tasks for session {session_id}.")
        except Exception as pe:
            logger.error(f"Task planning crash: {pe}")
            await agent_state_machine.transition_to(session_id, AgentState.FAILED)
            await self._broadcast_log(session_id, "observation", f"Planning failed: {str(pe)}")
            return False

        # Broadcast initial DAG
        await self._broadcast_dag(session_id, tasks)

        # Initialize Supervisor for steps check
        loop_supervisor.reset_steps(session_id)

        # 3. Transition to EXECUTING
        await agent_state_machine.transition_to(session_id, AgentState.EXECUTING)

        try:
            # Main DAG scheduling loop
            while True:
                # Find executable pending tasks (all dependencies completed)
                pending_tasks = [t for t in tasks if t["status"] == "pending"]
                executing_tasks = [t for t in tasks if t["status"] == "executing"]
                
                if not pending_tasks and not executing_tasks:
                    # All tasks finished!
                    break

                # Get executable tasks
                executable = []
                for t in pending_tasks:
                    deps = t.get("dependencies", [])
                    # Check if all dependency tasks have status == 'completed'
                    dep_tasks = [x for x in tasks if x["id"] in deps]
                    if all(x["status"] == "completed" for x in dep_tasks):
                        executable.append(t)

                if not executable and pending_tasks and not executing_tasks:
                    # Circular reference block or broken DAG path
                    raise ValueError("DAG Scheduling Error: Deadlock encountered. Outstanding tasks cannot resolve dependencies.")

                if not executable:
                    # Waiting for actively executing tasks to complete (if running concurrently; here we run sequentially)
                    await asyncio.sleep(0.5)
                    continue

                # Run the next executable task sequentially
                target_task = executable[0]
                target_task["status"] = "executing"
                await self._broadcast_dag(session_id, tasks)

                # Track step limit to prevent runaway loops
                loop_supervisor.increment_and_verify(session_id)

                # Dispatching
                assignee = target_task["assignee"]
                desc = target_task["description"]
                
                await self._broadcast_log(session_id, "thought", f"Scheduling milestone '{target_task['id']}' | Assignee: {assignee} | Action: {desc}")
                await agent_state_machine.transition_to(session_id, AgentState.OBSERVING)

                # Define task execution wrapped operational call
                async def execute_op():
                    if assignee == "CodingAgent":
                        return await self.coding_agent.execute_task(desc, context)
                    elif assignee == "BrowserAgent" or assignee == "ResearchAgent":
                        return await self.browser_agent.execute_task(desc, context)
                    else:
                        # Resilient fallback
                        return await self.coding_agent.execute_task(desc, context)

                # Execute with supervisor retries & backoff protection
                try:
                    success, outcome = await loop_supervisor.run_with_retry(session_id, execute_op)
                    
                    if success:
                        target_task["status"] = "completed"
                        await self._broadcast_log(session_id, "observation", f"✓ Milestone '{target_task['id']}' Completed successfully.\nResult details:\n{outcome}")
                    else:
                        target_task["status"] = "failed"
                        target_task["error"] = outcome
                        await self._broadcast_log(session_id, "observation", f"✗ Milestone '{target_task['id']}' Failed.\nDetails: {outcome}")
                        raise ValueError(f"Task {target_task['id']} failed during sandboxed execution: {outcome}")

                except Exception as ex:
                    target_task["status"] = "failed"
                    target_task["error"] = str(ex)
                    await self._broadcast_dag(session_id, tasks)
                    raise ex

                # Mark active and broadcast new DAG state
                await agent_state_machine.transition_to(session_id, AgentState.EXECUTING)
                await self._broadcast_dag(session_id, tasks)

            # 4. Final Completion
            await agent_state_machine.transition_to(session_id, AgentState.COMPLETED)
            await self._broadcast_log(session_id, "thought", "✓ Sovereign Goal execution successfully finalized. Ready for next query.")
            return True

        except Exception as e:
            logger.error(f"Agent execution run aborted in session {session_id}: {e}")
            await agent_state_machine.transition_to(session_id, AgentState.FAILED)
            await self._broadcast_log(session_id, "observation", f"✗ Session Aborted: {str(e)}")
            return False

    # ========================================================
    # TELEMETRY BROADCAST HELPERS
    # ========================================================

    async def _broadcast_log(self, session_id: str, type_str: str, content: str):
        """
        Sends step telemetry logs (thought, action, observation) over WebSocket session.
        """
        envelope = {
            "id": f"log_{uuid.uuid4().hex[:6]}",
            "type": f"agent.{type_str}",
            "session": session_id,
            "timestamp": time.time() * 1000.0,
            "payload": {
                "content": content
            }
        }
        await ws_manager.send_json_to_session(session_id, envelope)

    async def _broadcast_dag(self, session_id: str, tasks: List[Dict[str, Any]]):
        """
        Transmits current state of the execution Directed Acyclic Graph.
        """
        envelope = {
            "id": f"dag_{session_id}",
            "type": "agent.dag",
            "session": session_id,
            "timestamp": time.time() * 1000.0,
            "payload": {
                "tasks": tasks
            }
        }
        await ws_manager.send_json_to_session(session_id, envelope)

# Central Singleton Instance
agent_runtime = AgentRuntime()

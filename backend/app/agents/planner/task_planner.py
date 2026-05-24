import json
import uuid
import logging
from typing import List, Dict, Any

from providers.base import GenerateRequest
from backend.api.routers.chat import ai_router

logger = logging.getLogger("aetheros.agents.planner.task_planner")

class TaskPlanner:
    """
    TaskPlanner decomposes technical goals into Directed Acyclic Graphs (DAG)
    of sub-tasks with assignee mappings and circularity safeguards.
    """

    async def plan_goal(self, goal: str, model: str) -> List[Dict[str, Any]]:
        """
        Queries local inference models to build a clean JSON task array.
        """
        prompt = (
            "You are AetherOS's DAG Task Planner engine. Analyze the developer's goal and decompose it into "
            "a clean, sequential Directed Acyclic Graph (DAG) list of sub-tasks. Each task must represent a "
            "clear executable milestone (like reading code, installing dependencies, writing files, or running scripts).\n\n"
            "You MUST output ONLY a valid JSON array matching this exact specification. No preamble, no postscript.\n"
            "JSON SCHEMA:\n"
            "[\n"
            "  {\n"
            "    \"id\": \"task_1\",\n"
            "    \"description\": \"Brief description of the action to take\",\n"
            "    \"assignee\": \"CodingAgent\",\n"
            "    \"dependencies\": []\n"
            "  }\n"
            "]\n\n"
            "Assignees must be one of: 'CodingAgent', 'BrowserAgent', 'ResearchAgent'.\n"
            f"GOAL TO PLAN: \"{goal}\"\n\n"
            "Strict JSON Output:"
        )

        req = GenerateRequest(
            model=model,
            prompt=prompt,
            temperature=0.1,  # Keep it highly deterministic
            max_tokens=2048
        )

        output_tokens = []
        try:
            async for chunk in ai_router.generate(req):
                if chunk.token:
                    output_tokens.append(chunk.token)
            
            raw_json = "".join(output_tokens).strip()
            
            # Clean possible markdown wrapping blocks: ```json ... ```
            if raw_json.startswith("```json"):
                raw_json = raw_json[7:]
            if raw_json.endswith("```"):
                raw_json = raw_json[:-3]
            raw_json = raw_json.strip()

            tasks = json.loads(raw_json)
            
            if isinstance(tasks, list) and len(tasks) > 0:
                # Add default properties and validate
                validated_tasks = []
                id_map = {}
                
                for t in tasks:
                    t_id = t.get("id", f"task_{uuid.uuid4().hex[:6]}")
                    description = t.get("description", "Execute task milestone")
                    assignee = t.get("assignee", "CodingAgent")
                    deps = t.get("dependencies", [])
                    
                    if assignee not in {"CodingAgent", "BrowserAgent", "ResearchAgent"}:
                        assignee = "CodingAgent"
                        
                    task_obj = {
                        "id": t_id,
                        "description": description,
                        "assignee": assignee,
                        "dependencies": deps,
                        "status": "pending",
                        "error": None
                    }
                    validated_tasks.append(task_obj)
                    id_map[t_id] = task_obj

                # Validate dependencies against circularity
                if self._has_circular_dependencies(validated_tasks):
                    logger.warning("DAG circularity checks failed! Wiping dependencies to force sequential run.")
                    for t in validated_tasks:
                        t["dependencies"] = []
                        
                return validated_tasks
                
        except Exception as e:
            logger.error(f"Failed to generate structured goal DAG plan: {e}")

        # Resilient emergency single-step fallback (guarantees loop survival)
        fallback_id = f"task_{uuid.uuid4().hex[:6]}"
        return [{
            "id": fallback_id,
            "description": f"Execute autonomous goal: {goal}",
            "assignee": "CodingAgent",
            "dependencies": [],
            "status": "pending",
            "error": None
        }]

    def _has_circular_dependencies(self, tasks: List[Dict[str, Any]]) -> bool:
        """
        DFS cycles detector in Directed Graphs.
        """
        adj_list = {t["id"]: t["dependencies"] for t in tasks}
        visited = {}  # 0=unvisited, 1=visiting, 2=visited

        def dfs(node_id):
            if node_id not in adj_list:
                return False
            visited[node_id] = 1
            for neighbor in adj_list[node_id]:
                if visited.get(neighbor, 0) == 1:
                    return True
                if visited.get(neighbor, 0) == 0:
                    if dfs(neighbor):
                        return True
            visited[node_id] = 2
            return False

        for t in tasks:
            if visited.get(t["id"], 0) == 0:
                if dfs(t["id"]):
                    return True
        return False

# Central Singleton Instance
task_planner = TaskPlanner()

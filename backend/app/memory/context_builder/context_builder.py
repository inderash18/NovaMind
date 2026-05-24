import logging
from typing import Tuple, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.memory.persistence.db_models import UserSession, Message
from backend.app.memory.retrieval.retriever import retriever

logger = logging.getLogger("aetheros.memory.context_builder.context_builder")

class CognitiveContextBuilder:
    """
    CognitiveContextBuilder orchestrates token-aware context packaging,
    injecting relevant semantic facts and packing rolling dialog histories.
    """

    def __init__(self, token_limit: int = 6144):
        # 6K token default budget to ensure compatibility with standard local 8K windows
        self.token_limit = token_limit

    def _estimate_tokens(self, text: str) -> int:
        """
        Calculates a rough local token approximation (1 token = 4 characters).
        """
        if not text:
            return 0
        return len(text) // 4

    async def build_optimized_context(
        self,
        session_id: str,
        user_prompt: str,
        db: AsyncSession,
        workspace: str = "default"
    ) -> Tuple[str, str]:
        """
        Assembles a token-optimized prompt structure.
        Returns: Tuple[optimized_prompt, system_prompt]
        """
        # 1. Fetch Session config parameters from DB
        session_q = await db.execute(select(UserSession).where(UserSession.id == session_id))
        session = session_q.scalar_one_or_none()
        
        system_base = session.system_prompt if (session and session.system_prompt) else "You are AetherOS, a powerful sovereign AI operating system."
        
        # 2. Query vector memories concurrently matching user prompt query
        memories = await retriever.retrieve_relevant_memories(
            session_id=session_id,
            query=user_prompt,
            limit=3,
            workspace=workspace
        )

        # 3. Assemble and calculate memory tokens
        memory_context = ""
        if memories:
            memory_context = "\n[COGNITIVE MEMORY CONTEXT: The following relevant facts were retrieved from your local long-term memory. Use them to maintain deep personalization:\n"
            for m in memories:
                memory_context += f" - (Score: {m['score']:.2f}): \"{m['text']}\"\n"
            memory_context += "]\n"

        # Update combined system prompt
        extended_system_prompt = f"{system_base}\n{memory_context}"
        system_tokens = self._estimate_tokens(extended_system_prompt)

        # 4. Pull and pack historical dialogue turns until token limit is exhausted
        messages_q = await db.execute(
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.timestamp.desc())
        )
        history_messages = messages_q.scalars().all()

        current_budget = self.token_limit - system_tokens - self._estimate_tokens(user_prompt)
        
        packed_history: List[Message] = []
        
        for msg in history_messages:
            msg_tokens = self._estimate_tokens(msg.content)
            if msg.reasoning:
                msg_tokens += self._estimate_tokens(msg.reasoning)
                
            if current_budget - msg_tokens <= 0:
                logger.info(f"Context budget limit hit for session {session_id}. History packing truncated.")
                break
                
            packed_history.append(msg)
            current_budget -= msg_tokens

        # Reverse back to normal chronological ordering
        packed_history.reverse()

        # 5. Format packed history text segments
        history_text = ""
        for msg in packed_history:
            role_label = "Developer" if msg.role == "user" else "Aether Core"
            
            # Reconstruct thoughts if reasoning was generated (DeepSeek CoT traces)
            if msg.reasoning:
                history_text += f"\n<{role_label} reasoning>\n{msg.reasoning}\n</{role_label} reasoning>\n"
                
            history_text += f"\n{role_label}: {msg.content}\n"

        # Final assembled prompt injected into AI Router
        final_prompt = f"{history_text}\nDeveloper: {user_prompt}\nAether Core:"
        
        return final_prompt, extended_system_prompt

# Central Singleton Instance
context_builder = CognitiveContextBuilder()

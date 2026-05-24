import time
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.memory.persistence.db_models import UserSession, Message, MemoryReference
from backend.app.memory.chroma.chromadb_backend import chroma_backend
from backend.app.memory.embeddings.embedder import embedder
from providers.base import GenerateRequest
from backend.api.routers.chat import ai_router

logger = logging.getLogger("aetheros.memory.summarizer.summarizer")

class RollingSummarizer:
    """
    RollingSummarizer performs cognitive context compression, summarizing historical
    message segments into vectors before pruning relational tables.
    """

    def __init__(self):
        self.collection_name = "aetheros_semantic_memory"

    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4

    async def generate_summary(self, model: str, transcript: str) -> str:
        """
        Queries local inference runtimes to compile a bulleted semantic summary.
        """
        prompt = (
            "You are AetherOS's cognitive summarization engine. Analyze the following local conversation transcript "
            "between the 'Developer' and 'Aether Core'. Extract all key developer preferences, technical facts, "
            "system properties, and completed task milestones. Condense this information into a precise bullet-point "
            "list. Avoid conversational filler or introductory text.\n\n"
            f"TRANSCRIPT TO SUMMARIZE:\n{transcript}\n\n"
            "BULLETED SUMMARY:"
        )

        req = GenerateRequest(
            model=model,
            prompt=prompt,
            temperature=0.3,  # Low temperature for highly deterministic factual summaries
            max_tokens=1024
        )

        summary_tokens = []
        try:
            # Route to our prioritized failover provider mesh
            async for chunk in ai_router.generate(req):
                if chunk.token:
                    summary_tokens.append(chunk.token)
            
            return "".join(summary_tokens).strip()
        except Exception as e:
            logger.error(f"Failed to generate summary via local LLM: {e}")
            return ""

    async def auto_compress_and_persist(
        self,
        session_id: str,
        db: AsyncSession,
        threshold_tokens: int = 3500,
        workspace: str = "default"
    ) -> bool:
        """
        Compares active message lists against token bounds, summarizes old entries,
        writes vectors, and cleans up SQL rows.
        """
        # 1. Pull all messages of the session ordered chronologically
        messages_q = await db.execute(
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.timestamp.asc())
        )
        messages = messages_q.scalars().all()
        
        if not messages:
            return False

        # Calculate combined token weight of the session
        total_tokens = sum(self._estimate_tokens(m.content) for m in messages)
        if total_tokens < threshold_tokens:
            return False

        logger.info(f"Session {session_id} token volume ({total_tokens}) exceeds compression threshold ({threshold_tokens}). Initializing shift to long-term memory...")

        # 2. Select older messages to compress (first 2/3 of history)
        split_idx = int(len(messages) * 0.67)
        compress_batch = messages[:split_idx]
        preserve_batch = messages[split_idx:]
        
        if len(compress_batch) < 4:
            # Avoid summarizing small turns
            return False

        # 3. Compile chronological text transcript
        transcript_lines = []
        for msg in compress_batch:
            role_label = "Developer" if msg.role == "user" else "Aether Core"
            transcript_lines.append(f"{role_label}: {msg.content}")
        transcript = "\n".join(transcript_lines)

        # Retrieve active model configuration
        session_q = await db.execute(select(UserSession).where(UserSession.id == session_id))
        session = session_q.scalar_one_or_none()
        model_id = session.model if session else "qwen2.5-7b"

        # 4. Generate summary
        summary = await self.generate_summary(model_id, transcript)
        if not summary or summary.startswith("[SYSTEM FAILURE"):
            logger.error("Could not compile factual summary. Aborting compression pipeline.")
            return False

        # 5. Insert summary vector into ChromaDB
        memory_id = str(uuid.uuid4())
        vector = await embedder.embed_query(summary)
        
        metadata = {
            "session_id": session_id,
            "scope": "global",
            "workspace": workspace,
            "timestamp": int(time.time()),
            "type": "chat_summary"
        }

        add_success = await chroma_backend.add_memory(
            collection_name=self.collection_name,
            id=memory_id,
            text=summary,
            embedding=vector,
            metadata=metadata
        )

        if not add_success:
            logger.error("ChromaDB vector insertion failed. Aborting database prunes.")
            return False

        # 6. Save relational memory reference link
        ref = MemoryReference(
            id=str(uuid.uuid4()),
            session_id=session_id,
            vector_id=memory_id,
            text_chunk=summary,
            workspace=workspace
        )
        db.add(ref)

        # 7. Prune summarized message rows from PostgreSQL
        for msg in compress_batch:
            await db.delete(msg)

        await db.commit()
        logger.info(f"Cognitive compression finished. Pruned {len(compress_batch)} messages. Long-term memory saved under ID {memory_id}.")
        return True

# Central Singleton Instance
summarizer = RollingSummarizer()

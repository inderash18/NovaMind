import time
import math
import logging
from typing import List, Dict, Any, Optional

from backend.app.memory.embeddings.embedder import embedder
from backend.app.memory.chroma.chromadb_backend import chroma_backend

logger = logging.getLogger("aetheros.memory.retrieval.retriever")

class MemoryRetriever:
    """
    MemoryRetriever executes semantic query searches over local vector databases,
    applying workspace filters and recency score decays.
    """

    def __init__(self, decay_rate: float = 0.005, alpha: float = 0.7):
        # decay_rate: governs temporal decay speed (higher = older memories decay faster)
        self.decay_rate = decay_rate
        # alpha: balances semantic similarity weight (0.7) vs temporal recency weight (0.3)
        self.alpha = alpha
        self.collection_name = "aetheros_semantic_memory"

    async def retrieve_relevant_memories(
        self,
        session_id: str,
        query: str,
        limit: int = 5,
        workspace: Optional[str] = "default"
    ) -> List[Dict[str, Any]]:
        """
        Queries ChromaDB with similarity searches, applying hybrid temporal decay scoring.
        """
        if not query.strip():
            return []

        try:
            # 1. Translate query text into embedding vector
            query_vector = await embedder.embed_query(query)
            
            # 2. Build metadata query parameters
            where_filter = {}
            if session_id:
                # Retrieve memories belonging to this session or marked global
                where_filter["$or"] = [
                    {"session_id": session_id},
                    {"scope": "global"}
                ]
            
            if workspace and workspace != "default":
                # Ensure the filters incorporate workspace boundaries if defined
                if "$or" in where_filter:
                    where_filter = {
                        "$and": [
                            where_filter,
                            {"workspace": workspace}
                        ]
                    }
                else:
                    where_filter["workspace"] = workspace

            # 3. Fetch top vector matches
            raw_memories = await chroma_backend.query_memory(
                collection_name=self.collection_name,
                query_embedding=query_vector,
                limit=limit * 2,  # Fetch slightly more to re-rank via recency
                where_metadata=where_filter if where_filter else None
            )

            # 4. Compute temporal decay and re-rank
            now_ts = int(time.time())
            ranked_memories = []
            
            for mem in raw_memories:
                metadata = mem.get("metadata", {})
                timestamp = metadata.get("timestamp", now_ts)
                similarity = mem.get("similarity", 0.0)
                
                # Compute elapsed time in hours
                age_hours = max(0.0, (now_ts - timestamp) / 3600.0)
                
                # Exponential decay formula for temporal weighting: exp(-decay * age)
                time_weight = math.exp(-self.decay_rate * age_hours)
                
                # Hybrid ranking equation
                hybrid_score = (self.alpha * similarity) + ((1.0 - self.alpha) * time_weight)
                
                ranked_memories.append({
                    "id": mem["id"],
                    "text": mem["text"],
                    "metadata": metadata,
                    "similarity_score": similarity,
                    "recency_score": time_weight,
                    "score": hybrid_score
                })

            # Sort descending by final hybrid score
            ranked_memories.sort(key=lambda x: x["score"], reverse=True)
            
            return ranked_memories[:limit]
        except Exception as e:
            logger.error(f"Hybrid retrieval pipeline failed: {e}")
            return []

# Central Singleton Instance
retriever = MemoryRetriever()

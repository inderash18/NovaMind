import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.config.settings import settings

logger = logging.getLogger("aetheros.memory.chroma.chromadb_backend")

class ChromaDBBackend:
    """
    ChromaDBBackend manages local vector databases.
    Connects to high-throughput HTTP instances, falling back to local persistent file structures.
    """

    def __init__(self):
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        try:
            # Create standard data storage directory
            os.makedirs("./data/chroma", exist_ok=True)
            
            # Primary: Standalone high-throughput ChromaDB container via HTTP
            logger.info(f"Connecting to ChromaDB server at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}...")
            self.client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            # Query version to verify actual socket connections
            self.client.get_version()
            logger.info("ChromaDB HTTP client connected successfully.")
        except Exception as e:
            logger.warning(f"Standalone ChromaDB container unreachable: {e}. Bootstrapping local persistent fallback.")
            try:
                # Fallback: In-process SQLite persistent client
                self.client = chromadb.PersistentClient(
                    path="./data/chroma",
                    settings=ChromaSettings(anonymized_telemetry=False)
                )
                logger.info("Local file-persistent ChromaDB client initialized.")
            except Exception as le:
                logger.error(f"Failed to bootstrap any ChromaDB client instance: {le}")
                raise

    def get_or_create_collection(self, collection_name: str):
        """
        Creates or retrieves a vector collection.
        """
        if self.client is None:
            raise Exception("ChromaDB client is not initialized.")
        return self.client.get_or_create_collection(name=collection_name)

    async def add_memory(
        self,
        collection_name: str,
        id: str,
        text: str,
        embedding: List[float],
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Upserts a semantic vector and textual payload into the ChromaDB indices.
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            # Use run_in_executor to avoid blocking the event loop on blocking I/O calls
            import asyncio
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                None,
                lambda: collection.add(
                    ids=[id],
                    embeddings=[embedding],
                    documents=[text],
                    metadatas=[metadata]
                )
            )
            return True
        except Exception as e:
            logger.error(f"Failed to insert vector memory into ChromaDB: {e}")
            return False

    async def query_memory(
        self,
        collection_name: str,
        query_embedding: List[float],
        limit: int = 5,
        where_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes metadata-filtered cosine similarity vector searches.
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            import asyncio
            loop = asyncio.get_running_loop()
            
            # Format metadata filter syntax standard
            query_kwargs = {
                "query_embeddings": [query_embedding],
                "n_results": limit
            }
            if where_metadata:
                query_kwargs["where"] = where_metadata

            results = await loop.run_in_executor(
                None,
                lambda: collection.query(**query_kwargs)
            )

            # Re-map results matrices to clear flat dictionary arrays
            memories = []
            if not results or not results.get("ids"):
                return []

            ids = results["ids"][0]
            documents = results["documents"][0]
            metadatas = results["metadatas"][0]
            distances = results.get("distances", [[]])[0]

            for i in range(len(ids)):
                # ChromaDB distance is cosine distance (1 - similarity)
                # Map back to cosine similarity score: 1.0 - distance
                dist = distances[i] if i < len(distances) else 0.0
                similarity_score = max(0.0, min(1.0, 1.0 - dist))
                
                memories.append({
                    "id": ids[i],
                    "text": documents[i],
                    "metadata": metadatas[i],
                    "similarity": similarity_score
                })

            return memories
        except Exception as e:
            logger.error(f"Failed to query semantic memories from ChromaDB: {e}")
            return []

    async def delete_memory(self, collection_name: str, id: str) -> bool:
        """
        Prunes a single vector record from the indices.
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            import asyncio
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                None,
                lambda: collection.delete(ids=[id])
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete vector memory {id} from ChromaDB: {e}")
            return False

# Central Singleton Instance
chroma_backend = ChromaDBBackend()

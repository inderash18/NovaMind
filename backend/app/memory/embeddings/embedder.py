import hashlib
import asyncio
import logging
from typing import List
import httpx

from backend.config.settings import settings

logger = logging.getLogger("aetheros.memory.embeddings.embedder")

class LocalEmbedder:
    """
    LocalEmbedder resolves text strings into high-dimensional semantic vectors.
    Queries local Ollama primary endpoints, falling back to local libraries.
    """

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)
        self.model = settings.DEFAULT_EMBEDDING_MODEL
        self._transformer_model = None

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Generates semantic embeddings for a batch of documents.
        """
        if not texts:
            return []

        try:
            # Primary: Local Ollama bulk embedding query
            response = await self.client.post(
                f"{settings.OLLAMA_ENDPOINT}/api/embed",
                json={"model": self.model, "input": texts}
            )
            if response.status_code == 200:
                data = response.json()
                embeddings = data.get("embeddings", [])
                if len(embeddings) == len(texts):
                    return embeddings
        except Exception as e:
            logger.warning(f"Ollama local embedding endpoint failed: {e}. Attempting offline library fallback...")

        # Secondary: Sentence-Transformers CPU local fallback
        try:
            return await self._run_sentence_transformers_embed(texts)
        except Exception as se:
            logger.warning(f"Local sentence-transformers offline loading failed: {se}. Running deterministic mock failover.")

        # Emergency Failover: Deterministic mathematical vector builder (guarantees zero crashes)
        return [self._generate_deterministic_mock_vector(text) for text in texts]

    async def embed_query(self, text: str) -> List[float]:
        """
        Generates a semantic embedding for a single search query.
        """
        results = await self.embed_documents([text])
        return results[0] if results else [0.0] * 384

    async def _run_sentence_transformers_embed(self, texts: List[str]) -> List[List[float]]:
        """
        Executes CPU-bound Sentence Transformers embedding on a background thread pool.
        """
        # Lazy load model to avoid importing expensive torch/transformers modules on initial backend boot
        if self._transformer_model is None:
            from sentence_transformers import SentenceTransformer
            # Runs CPU-optimized tiny model locally
            self._transformer_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer (all-MiniLM-L6-v2) initialized for fallback embeddings.")

        # Run CPU-intensive matrix multiplications in executors to keep FastAPI loops fully non-blocking
        loop = asyncio.get_running_loop()
        embeddings = await loop.run_in_executor(
            None, 
            lambda: self._transformer_model.encode(texts, convert_to_numpy=True).tolist()
        )
        return embeddings

    def _generate_deterministic_mock_vector(self, text: str, dimension: int = 384) -> List[float]:
        """
        Deterministic, hash-driven normalized float array generator.
        Provides a safe mathematical vector fallback when Ollama is offline.
        """
        vector = []
        # Seed generator based on character segments
        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        
        for i in range(dimension):
            # Create deterministic float values between -1.0 and 1.0 using hash windows
            chunk = text_hash[(i * 2) % len(text_hash) : ((i * 2) + 2) % len(text_hash)]
            val = int(chunk, 16) / 255.0 if chunk else 0.5
            vector.append((val * 2.0) - 1.0)
            
        # Normalize the mock vector to unit length (important for cosine similarity!)
        magnitude = sum(x * x for x in vector) ** 0.5
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
            
        return vector

    async def close(self):
        await self.client.aclose()

# Central Singleton Instance
embedder = LocalEmbedder()

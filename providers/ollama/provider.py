import time
import json
import asyncio
import logging
from typing import AsyncIterator, List, Dict, Any, Optional
import httpx

from providers.base import (
    BaseProvider,
    ProviderHealth,
    ProviderStatus,
    GenerateRequest,
    GenerateChunk,
    ModelInfo,
    ProviderConfig
)

logger = logging.getLogger("aetheros.providers.ollama")

class OllamaProvider(BaseProvider):
    """
    Ollama implementation for AetherOS.
    Queries the local Ollama API for low-latency offline inference.
    """
    
    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self.client = httpx.AsyncClient(timeout=10.0)

    async def health_check(self) -> ProviderHealth:
        start_time = time.perf_counter()
        try:
            # Quick ping to /api/tags to see if Ollama is up and get model listing
            response = await self.client.get(f"{self.config.endpoint}/api/tags")
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            
            if response.status_code == 200:
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
                
                # Probing system info or mock VRAM free since Ollama doesn't expose it directly in tags
                return ProviderHealth(
                    status=ProviderStatus.HEALTHY,
                    latency_ms=latency_ms,
                    available_models=models,
                    vram_free_mb=0.0,  # Probed via gpu_probe later in Phase 1
                )
            else:
                return ProviderHealth(
                    status=ProviderStatus.DEGRADED,
                    latency_ms=latency_ms,
                    error_message=f"Ollama returned status code {response.status_code}"
                )
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return ProviderHealth(
                status=ProviderStatus.OFFLINE,
                latency_ms=0.0,
                error_message=str(e)
            )

    async def generate(self, request: GenerateRequest) -> AsyncIterator[GenerateChunk]:
        """
        Streams generation from Ollama `/api/generate` or `/api/chat`.
        We'll use `/api/chat` to maintain structure and support system prompt natively.
        """
        url = f"{self.config.endpoint}/api/chat"
        
        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        
        # In a local OS, user prompt contains the content
        messages.append({"role": "user", "content": request.prompt})
        
        payload = {
            "model": request.model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens,
            }
        }
        
        if request.stop:
            payload["options"]["stop"] = request.stop
            
        if request.extra_params:
            payload["options"].update(request.extra_params)
            
        # Standard async streaming transport
        # We need a separate client for streaming to avoid blocking the health_check client connection pool
        async with httpx.AsyncClient(timeout=60.0) as stream_client:
            try:
                async with stream_client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        raise Exception(f"Ollama API error: {response.status_code} - {error_body.decode()}")
                    
                    # Track thinking state to elegantly isolate reasoning vs standard response tokens
                    in_thinking_tag = False
                    
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        
                        try:
                            data = json.loads(line)
                            message = data.get("message", {})
                            token = message.get("content", "")
                            
                            # Parse advanced reasoning content if provided by Ollama (like DeepSeek R1 outputs)
                            reasoning_token = message.get("reasoning_content", "")
                            
                            # Handle fallback parser for older configurations returning raw <think> tags in the token stream
                            if not reasoning_token and token:
                                if "<think>" in token:
                                    in_thinking_tag = True
                                    token = token.replace("<think>", "")
                                if "</think>" in token:
                                    in_thinking_tag = False
                                    token = token.replace("</think>", "")
                                    
                                if in_thinking_tag:
                                    reasoning_token = token
                                    token = ""
                                    
                            is_final = data.get("done", False)
                            
                            prompt_tokens = data.get("prompt_eval_count")
                            completion_tokens = data.get("eval_count")
                            
                            yield GenerateChunk(
                                token=token,
                                thinking_token=reasoning_token if reasoning_token else None,
                                is_final=is_final,
                                prompt_tokens=prompt_tokens,
                                completion_tokens=completion_tokens
                            )
                        except json.JSONDecodeError:
                            logger.error(f"Failed to decode Ollama stream JSON line: {line}")
                            continue
            except asyncio.CancelledError:
                logger.info("Ollama streaming task cancelled by requester.")
                raise
            except Exception as e:
                logger.error(f"Error during Ollama stream processing: {e}")
                yield GenerateChunk(token=f"\n[Ollama Steam Error: {e}]", is_final=True)

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Queries Ollama's modern `/api/embed` endpoint.
        Falls back to `/api/embeddings` if single text.
        """
        # Default local-first embedding model standard
        model = settings_model = getattr(self.config, "embedding_model", "nomic-embed-text")
        
        try:
            # Attempt unified bulk embedding call
            response = await self.client.post(
                f"{self.config.endpoint}/api/embed",
                json={"model": model, "input": texts}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("embeddings", [])
        except Exception as e:
            logger.warning(f"Ollama primary embed api failed, trying fallback: {e}")
            
        # Fallback to single loop on old /api/embeddings api if needed
        embeddings = []
        for text in texts:
            try:
                res = await self.client.post(
                    f"{self.config.endpoint}/api/embeddings",
                    json={"model": model, "prompt": text}
                )
                if res.status_code == 200:
                    embeddings.append(res.json().get("embedding", []))
                else:
                    embeddings.append([])
            except Exception as ex:
                logger.error(f"Ollama fallback embedding retrieval failed: {ex}")
                embeddings.append([])
        return embeddings

    async def list_models(self) -> List[ModelInfo]:
        try:
            response = await self.client.get(f"{self.config.endpoint}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = []
                for m in data.get("models", []):
                    details = m.get("details", {})
                    models.append(
                        ModelInfo(
                            id=m["name"],
                            name=m["name"],
                            size_bytes=m.get("size"),
                            quantization=details.get("quantization_level"),
                            vram_required_mb=None,
                            details=details
                        )
                    )
                return models
        except Exception as e:
            logger.error(f"Failed to fetch Ollama model list: {e}")
        return []

    async def load_model(self, model_id: str) -> bool:
        """
        Pre-loads the model in VRAM by initiating a generate call with empty prompt.
        Ollama keeps it cached in memory based on its configuration (typically 5 mins).
        """
        try:
            response = await self.client.post(
                f"{self.config.endpoint}/api/generate",
                json={"model": model_id, "prompt": "", "keep_alive": "5m"}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Failed to prime Ollama model {model_id}: {e}")
            return False
            
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

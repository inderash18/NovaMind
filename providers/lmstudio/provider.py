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

logger = logging.getLogger("aetheros.providers.lmstudio")

class LMStudioProvider(BaseProvider):
    """
    LM Studio implementation for AetherOS.
    Leverages OpenAI-compatible local endpoints at `localhost:1234`.
    """
    
    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self.client = httpx.AsyncClient(timeout=10.0)

    async def health_check(self) -> ProviderHealth:
        start_time = time.perf_counter()
        try:
            # Query the OpenAI standard GET /v1/models endpoint
            response = await self.client.get(f"{self.config.endpoint}/v1/models")
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            
            if response.status_code == 200:
                data = response.json()
                models = [m["id"] for m in data.get("data", [])]
                return ProviderHealth(
                    status=ProviderStatus.HEALTHY,
                    latency_ms=latency_ms,
                    available_models=models,
                    vram_free_mb=0.0  # Probed via host diagnostics later
                )
            else:
                return ProviderHealth(
                    status=ProviderStatus.DEGRADED,
                    latency_ms=latency_ms,
                    error_message=f"LM Studio returned status code {response.status_code}"
                )
        except Exception as e:
            logger.warning(f"LM Studio health check failed: {e}")
            return ProviderHealth(
                status=ProviderStatus.OFFLINE,
                latency_ms=0.0,
                error_message=str(e)
            )

    async def generate(self, request: GenerateRequest) -> AsyncIterator[GenerateChunk]:
        """
        Streams completions via OpenAI chat completions protocol (/v1/chat/completions).
        """
        url = f"{self.config.endpoint}/v1/chat/completions"
        
        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.append({"role": "user", "content": request.prompt})
        
        payload = {
            "model": request.model,
            "messages": messages,
            "stream": True,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens
        }
        
        if request.stop:
            payload["stop"] = request.stop
            
        if request.extra_params:
            payload.update(request.extra_params)
            
        async with httpx.AsyncClient(timeout=60.0) as stream_client:
            try:
                async with stream_client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        raise Exception(f"LM Studio API error: {response.status_code} - {error_body.decode()}")
                    
                    # Track thinking tags for models outputting raw HTML tags
                    in_thinking_tag = False
                    
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if not line.startswith("data: "):
                            continue
                        
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            yield GenerateChunk(is_final=True)
                            break
                            
                        try:
                            data = json.loads(data_str)
                            choices = data.get("choices", [])
                            if not choices:
                                continue
                                
                            delta = choices[0].get("delta", {})
                            token = delta.get("content", "")
                            
                            # Parse advanced reasoning content if provided in modern API definitions
                            reasoning_token = delta.get("reasoning_content", delta.get("reasoning", ""))
                            
                            # Fallback parser for raw thinking tags in standard tokens
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
                                    
                            is_final = choices[0].get("finish_reason") is not None
                            
                            # Fetch token count if provided (OpenAI spec)
                            usage = data.get("usage", {})
                            prompt_tokens = usage.get("prompt_tokens")
                            completion_tokens = usage.get("completion_tokens")
                            
                            yield GenerateChunk(
                                token=token,
                                thinking_token=reasoning_token if reasoning_token else None,
                                is_final=is_final,
                                prompt_tokens=prompt_tokens,
                                completion_tokens=completion_tokens
                            )
                        except json.JSONDecodeError:
                            logger.error(f"Failed to decode LM Studio stream token: {data_str}")
                            continue
            except asyncio.CancelledError:
                logger.info("LM Studio generation task cancelled by client.")
                raise
            except Exception as e:
                logger.error(f"Error during LM Studio streaming: {e}")
                yield GenerateChunk(token=f"\n[LM Studio Stream Error: {e}]", is_final=True)

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Retrieves vector embeddings using standard OpenAI embeddings interface.
        """
        # Pick the requested default model or active configuration model
        model = getattr(self.config, "embedding_model", "nomic-embed-text")
        
        try:
            response = await self.client.post(
                f"{self.config.endpoint}/v1/embeddings",
                json={"input": texts, "model": model}
            )
            if response.status_code == 200:
                data = response.json()
                # Sort arrays matching index positioning
                sorted_embeddings = sorted(data.get("data", []), key=lambda x: x.get("index", 0))
                return [item["embedding"] for item in sorted_embeddings]
        except Exception as e:
            logger.error(f"LM Studio embeddings call failed: {e}")
        return [[] for _ in texts]

    async def list_models(self) -> List[ModelInfo]:
        try:
            response = await self.client.get(f"{self.config.endpoint}/v1/models")
            if response.status_code == 200:
                data = response.json()
                models = []
                for m in data.get("data", []):
                    models.append(
                        ModelInfo(
                            id=m["id"],
                            name=m["id"],
                            size_bytes=None,
                            quantization=None,
                            vram_required_mb=None,
                            details=m
                        )
                    )
                return models
        except Exception as e:
            logger.error(f"Failed to list LM Studio models: {e}")
        return []

    async def load_model(self, model_id: str) -> bool:
        # LM Studio automatically handles model swaps in its configuration, so we mark successfully
        return True

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

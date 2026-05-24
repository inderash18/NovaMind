import asyncio
import logging
from typing import AsyncIterator, List, Dict, Any, Optional
import httpx

from backend.config.settings import settings
from providers.base import (
    BaseProvider,
    ProviderHealth,
    ProviderStatus,
    GenerateRequest,
    GenerateChunk,
    ModelInfo,
    ProviderConfig
)
from providers.ollama.provider import OllamaProvider
from providers.lmstudio.provider import LMStudioProvider

logger = logging.getLogger("aetheros.providers.router")

# Hardcoded model equivalence catalog for failover matching
MODEL_EQUIVALENCE: Dict[str, List[str]] = {
    "deepseek-coder-6.7b": ["deepseek-coder:6.7b", "deepseek-coder-6.7b-instruct.Q4_K_M.gguf", "deepseek-coder-6.7b-instruct"],
    "llava-13b":           ["llava:13b", "llava-v1.5-13b-Q4_K_M.gguf", "llava-13b"],
    "qwen2.5-7b":          ["qwen2.5:7b", "qwen2.5-7b-instruct.Q4_K_M.gguf", "qwen2.5-7b-instruct", "qwen2.5-7b"],
}

class AIRouter:
    """
    AIRouter manages the prioritized provider chain, performing real-time
    diagnostics and automatic failover transitions when local endpoints go offline.
    """

    def __init__(self):
        # Configure local providers in prioritized chain
        self.providers_configs = [
            ProviderConfig(name="ollama", endpoint=settings.OLLAMA_ENDPOINT, priority=1),
            ProviderConfig(name="lmstudio", endpoint=settings.LMSTUDIO_ENDPOINT, priority=2),
        ]
        
        self.providers: Dict[str, BaseProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        for config in self.providers_configs:
            if not config.enabled:
                continue
            if config.name == "ollama":
                self.providers[config.name] = OllamaProvider(config)
            elif config.name == "lmstudio":
                self.providers[config.name] = LMStudioProvider(config)
            else:
                logger.warning(f"Unknown provider config type: {config.name}")

    async def get_prioritized_provider_chain(self) -> List[tuple[str, BaseProvider]]:
        """
        Runs concurrent health check queries to rank active, responsive providers.
        """
        active_chain = []
        # Query statuses concurrently with timeout protection
        tasks = {name: provider.health_check() for name, provider in self.providers.items()}
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        
        provider_names = list(tasks.keys())
        healths: Dict[str, ProviderHealth] = {}
        
        for name, res in zip(provider_names, results):
            if isinstance(res, Exception):
                healths[name] = ProviderHealth(status=ProviderStatus.OFFLINE, error_message=str(res))
            else:
                healths[name] = res

        # Sort based on configured priority (lower priority number = higher preference)
        sorted_configs = sorted(self.providers_configs, key=lambda c: c.priority)
        
        for config in sorted_configs:
            name = config.name
            if name in self.providers and healths[name].status == ProviderStatus.HEALTHY:
                active_chain.append((name, self.providers[name]))
                
        # Also append degraded ones to bottom of the chain as final emergency fallback
        for config in sorted_configs:
            name = config.name
            if name in self.providers and healths[name].status == ProviderStatus.DEGRADED:
                active_chain.append((name, self.providers[name]))
                
        return active_chain

    def get_equivalent_models(self, requested_model: str) -> List[str]:
        """
        Resolves a generic model identification to all matching equivalent hashes/tags.
        """
        equivalents = [requested_model]
        # Check standard equivalence map keys
        if requested_model in MODEL_EQUIVALENCE:
            equivalents.extend(MODEL_EQUIVALENCE[requested_model])
        # Reverse search equivalence map list values
        for primary, aliases in MODEL_EQUIVALENCE.items():
            if requested_model in aliases:
                equivalents.append(primary)
                equivalents.extend([a for a in aliases if a != requested_model])
                break
        return list(dict.fromkeys(equivalents))  # deduplicate preserving order

    async def health_check_all(self) -> Dict[str, ProviderHealth]:
        healths = {}
        for name, provider in self.providers.items():
            healths[name] = await provider.health_check()
        return healths

    async def list_all_models(self) -> List[Dict[str, Any]]:
        """
        Aggregates model inventories across all active runtimes.
        """
        all_models = []
        for name, provider in self.providers.items():
            try:
                models = await provider.list_models()
                for m in models:
                    all_models.append({
                        "id": m.id,
                        "name": m.name,
                        "provider": name,
                        "quantization": m.quantization,
                        "size_bytes": m.size_bytes
                    })
            except Exception as e:
                logger.error(f"Failed to query model list for provider {name}: {e}")
        return all_models

    async def embed(self, texts: List[str], requested_model: Optional[str] = None) -> List[List[float]]:
        """
        Dispatches embedding text requests with transparent local fallback.
        """
        active_chain = await self.get_prioritized_provider_chain()
        if not active_chain:
            raise Exception("All local embedding providers are offline.")

        for name, provider in active_chain:
            try:
                return await provider.embed(texts)
            except Exception as e:
                logger.error(f"Embedding failed on {name}: {e}. Retrying next provider...")
                continue
                
        raise Exception("All local embedding generation failed.")

    async def generate(self, request: GenerateRequest) -> AsyncIterator[GenerateChunk]:
        """
        Executes real-time failover streaming completions.
        If a server crashes, drops connections, or throws timeouts, the generator
        transparently switches to the next priority provider.
        """
        active_chain = await self.get_prioritized_provider_chain()
        if not active_chain:
            yield GenerateChunk(
                token="\n[SYSTEM CRITICAL: Zero active local AI providers detected. Please verify Ollama or LM Studio is running.]",
                is_final=True
            )
            return

        equivalents = self.get_equivalent_models(request.model)
        
        last_error = None
        generation_started = False
        
        for provider_name, provider in active_chain:
            # Probe models on this provider to check if requested or equivalent weight exists
            available_models = []
            try:
                prov_models = await provider.list_models()
                available_models = [m.id for m in prov_models]
            except Exception as ex:
                logger.warning(f"Could not list models for {provider_name}: {ex}")
                
            # Find the first matching active alias that this provider possesses
            selected_model = None
            for eq in equivalents:
                if eq in available_models:
                    selected_model = eq
                    break
                    
            if not selected_model:
                # If provider lists models, but doesn't have equivalents, try default or fallback to the requested tag anyway
                if available_models:
                    logger.info(f"Provider {provider_name} does not explicitly host {request.model}. Trying requested model directly.")
                selected_model = request.model

            # Clone and update target model key for specific provider
            provider_request = GenerateRequest(
                model=selected_model,
                prompt=request.prompt,
                system_prompt=request.system_prompt,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                stop=request.stop,
                extra_params=request.extra_params
            )

            # Injected streaming log for failover notifications
            if generation_started:
                yield GenerateChunk(
                    token=f"\n\n[System Failover: Active runtime crashed. Hot-swapping model generation to backup provider: **{provider_name}**...]\n\n"
                )

            logger.info(f"Routing request to provider: {provider_name} using model {selected_model}")
            
            try:
                # Iterate over tokens yielding them
                async for chunk in provider.generate(provider_request):
                    generation_started = True
                    yield chunk
                # If we successfully exhaust the stream without crashing, exit router loop
                return
            except (httpx.ConnectError, httpx.TimeoutException, asyncio.TimeoutError) as err:
                logger.warning(f"Connection failover triggered on provider {provider_name} due to: {err}")
                last_error = err
                continue
            except Exception as e:
                logger.error(f"Inference execution failed on provider {provider_name}: {e}")
                last_error = e
                continue

        # If we exhausted the chain without return
        yield GenerateChunk(
            token=f"\n\n[SYSTEM FAILURE: All configured local providers ({', '.join([c.name for c in self.providers_configs])}) failed to generate response. Last Error: {last_error}]",
            is_final=True
        )

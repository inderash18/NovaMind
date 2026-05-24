import time
import uuid
import logging
import asyncio
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.core.websocket_manager import ws_manager
from backend.schemas.chat import (
    WSMessage,
    WSMessageType,
    ChatStartPayload,
    ChatTokenPayload,
    ChatThinkingPayload,
    ChatDonePayload,
    ChatErrorPayload
)
from providers.base import GenerateRequest
from providers.router import AIRouter

# Phase 2 Database & Memory Imports
from sqlalchemy import select
from backend.app.memory.persistence.db_session import async_session_maker
from backend.app.memory.persistence.db_models import UserSession, Message, MemoryReference
from backend.app.memory.context_builder.context_builder import context_builder
from backend.app.memory.summarizer.summarizer import summarizer
from backend.app.memory.embeddings.embedder import embedder
from backend.app.memory.chroma.chromadb_backend import chroma_backend

logger = logging.getLogger("aetheros.api.routers.chat")
router = APIRouter()

# Instantiate global AIRouter singleton
ai_router = AIRouter()

@router.websocket("/ws/chat/{session_id}")
async def websocket_chat_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time, low-latency streaming chat interactions.
    """
    await ws_manager.connect(session_id, websocket)
    
    try:
        while True:
            # Block waiting for incoming JSON payload envelopes
            data = await websocket.receive_json()
            
            try:
                # Correlate unique packet fields
                msg_id = data.get("id", str(uuid.uuid4()))
                msg_type = data.get("type")
                payload_data = data.get("payload", {})
                
                if msg_type == WSMessageType.CHAT_START:
                    # Validate startup payload parameters
                    start_payload = ChatStartPayload(**payload_data)
                    
                    # Spawn streaming generation in background to allow client abort controls
                    asyncio.create_task(
                        handle_chat_generation(
                            session_id=session_id,
                            msg_id=msg_id,
                            payload=start_payload
                        )
                    )
                else:
                    logger.warning(f"Unrecognized incoming WS message type: {msg_type}")
                    
            except Exception as pe:
                logger.error(f"Failed to parse incoming WS message: {pe}")
                err_envelope = WSMessage(
                    id=str(uuid.uuid4()),
                    type=WSMessageType.CHAT_ERROR,
                    session=session_id,
                    payload=ChatErrorPayload(message=f"Invalid payload format: {str(pe)}")
                )
                await ws_manager.send_personal_message(err_envelope.model_dump(), websocket)
                
    except WebSocketDisconnect:
        logger.info(f"Client disconnected from WebSocket chat endpoint for session {session_id}")
        ws_manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket endpoint exception: {e}")
        ws_manager.disconnect(session_id, websocket)

async def handle_chat_generation(session_id: str, msg_id: str, payload: ChatStartPayload):
    """
    Asynchronous executor pipeline driving LLM streams and writing token frames.
    Integrates persistent databases, cognitive contexts, and vector memories.
    """
    start_time = time.perf_counter()
    logger.info(f"Starting chat generation session {session_id} using model {payload.model}")
    
    prompt_tokens = 0
    completion_tokens = 0
    full_content = []
    full_reasoning = []
    
    try:
        # Establish relational database boundaries
        async with async_session_maker() as db:
            # 1. Fetch or create structural UserSession
            session_q = await db.execute(select(UserSession).where(UserSession.id == session_id))
            session = session_q.scalar_one_or_none()
            
            if not session:
                session = UserSession(
                    id=session_id,
                    title=f"Session: {payload.prompt[:22]}...",
                    model=payload.model,
                    temperature=payload.temperature
                )
                db.add(session)
                await db.commit()
                await db.refresh(session)
            
            # 2. Save User prompt message directly to SQL
            user_msg_id = str(uuid.uuid4())
            user_msg = Message(
                id=user_msg_id,
                session_id=session_id,
                role="user",
                content=payload.prompt,
                timestamp=datetime.utcnow()
            )
            db.add(user_msg)
            await db.commit()
            
            # 3. Build token-budget optimized prompt with semantic facts injected
            optimized_prompt, system_instruction = await context_builder.build_optimized_context(
                session_id=session_id,
                user_prompt=payload.prompt,
                db=db
            )
            
            # 4. Initialize GenerateRequest structure
            req = GenerateRequest(
                model=payload.model,
                prompt=optimized_prompt,
                system_prompt=system_instruction,
                temperature=payload.temperature,
                max_tokens=payload.max_tokens,
                extra_params=payload.extra_params
            )
            
            # 5. Route queries dynamically through fallbacks AI Router
            async for chunk in ai_router.generate(req):
                if chunk.prompt_tokens:
                    prompt_tokens = chunk.prompt_tokens
                if chunk.completion_tokens:
                    completion_tokens = chunk.completion_tokens
                    
                # Stream reasoning Chain-of-Thought (CoT) tokens if present
                if chunk.thinking_token:
                    full_reasoning.append(chunk.thinking_token)
                    envelope = WSMessage(
                        id=msg_id,
                        type=WSMessageType.CHAT_THINKING,
                        session=session_id,
                        payload=ChatThinkingPayload(token=chunk.thinking_token)
                    )
                    await ws_manager.send_json_to_session(session_id, envelope.model_dump())
                    
                # Stream default response completions
                if chunk.token:
                    full_content.append(chunk.token)
                    envelope = WSMessage(
                        id=msg_id,
                        type=WSMessageType.CHAT_TOKEN,
                        session=session_id,
                        payload=ChatTokenPayload(token=chunk.token)
                    )
                    await ws_manager.send_json_to_session(session_id, envelope.model_dump())
            
            # Compile final response texts
            final_content_str = "".join(full_content)
            final_reasoning_str = "".join(full_reasoning)
            
            # 6. Save Assistant response directly to SQL
            assistant_msg = Message(
                id=msg_id,
                session_id=session_id,
                role="assistant",
                content=final_content_str,
                reasoning=final_reasoning_str if final_reasoning_str else None,
                timestamp=datetime.utcnow()
            )
            db.add(assistant_msg)
            await db.commit()
            
            # Calculate process analytics
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            
            # Dispatch completion done frame
            done_envelope = WSMessage(
                id=msg_id,
                type=WSMessageType.CHAT_DONE,
                session=session_id,
                payload=ChatDonePayload(
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_time_ms=elapsed_ms
                )
            )
            await ws_manager.send_json_to_session(session_id, done_envelope.model_dump())
            logger.info(f"Finished generation session {session_id} successfully. Time: {elapsed_ms:.1f}ms")
            
            # 7. Index conversational turn to ChromaDB as permanent long-term memory
            asyncio.create_task(
                index_conversation_turn(
                    session_id=session_id,
                    prompt=payload.prompt,
                    response=final_content_str
                )
            )
            
            # 8. Check short-term context bounds and trigger rolling summaries compression
            asyncio.create_task(
                summarizer.auto_compress_and_persist(
                    session_id=session_id,
                    db=db
                )
            )
            
    except asyncio.CancelledError:
        logger.info(f"Stream generation task for session {session_id} cancelled.")
        raise
    except Exception as e:
        logger.error(f"Failed to generate streaming response for session {session_id}: {e}")
        err_envelope = WSMessage(
            id=msg_id,
            type=WSMessageType.CHAT_ERROR,
            session=session_id,
            payload=ChatErrorPayload(message=f"Generation failed: {str(e)}")
        )
        await ws_manager.send_json_to_session(session_id, err_envelope.model_dump())

async def index_conversation_turn(session_id: str, prompt: str, response: str):
    """
    Background worker indexing conversation turns to the ChromaDB collections.
    """
    try:
        turn_text = f"Developer: {prompt}\nAether Core: {response}"
        memory_id = str(uuid.uuid4())
        
        # Generate semantic vector
        vector = await embedder.embed_query(turn_text)
        
        metadata = {
            "session_id": session_id,
            "scope": "episodic",
            "workspace": "default",
            "timestamp": int(time.time()),
            "type": "turn"
        }
        
        # Write to ChromaDB
        await chroma_backend.add_memory(
            collection_name="aetheros_semantic_memory",
            id=memory_id,
            text=turn_text,
            embedding=vector,
            metadata=metadata
        )
    except Exception as e:
        logger.error(f"Background conversation turn indexing failed: {e}")


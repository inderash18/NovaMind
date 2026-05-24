import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { useAgentStore } from './agent.store';


export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;  // DeepSeek-R1 Chain-of-Thought reasoning
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  systemPrompt?: string;
  temperature: number;
  created_at: number;
}

export interface ProviderStatus {
  status: 'healthy' | 'degraded' | 'offline';
  latency_ms: number;
  available_models: string[];
  vram_free_mb: number;
  error_message?: string;
}

export interface MemoryResult {
  id: string;
  text: string;
  similarity_score: number;
  score: number;
  metadata: Record<string, any>;
}

export interface ChatState {
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  isStreaming: boolean;
  inputMessage: string;
  activeModel: string;
  availableModels: { id: string; name: string; provider: string }[];
  providers: Record<string, ProviderStatus>;
  searchResults: MemoryResult[];
  
  // Actions
  loadAllSessions: () => Promise<void>;
  createSession: (title?: string, model?: string) => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  setInputMessage: (msg: string) => void;
  setActiveModel: (model: string) => void;
  clearHistory: (sessionId: string) => void;
  searchMemories: (query: string) => Promise<void>;
  
  // Core WS Operations
  sendMessage: (promptText: string) => Promise<void>;
  fetchSystemStatus: () => Promise<void>;
}

// Track active WebSocket references out-of-store to avoid serializing socket objects
const activeWebSockets: Record<string, WebSocket> = {};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeSessionId: null,
      isStreaming: false,
      inputMessage: '',
      activeModel: 'qwen2.5-7b',
      availableModels: [],
      providers: {},
      searchResults: [],

      loadAllSessions: async () => {
        try {
          const res = await fetch('http://localhost:8000/api/v1/sessions');
          if (res.ok) {
            const data = await res.json();
            const sessionMap: Record<string, Session> = {};
            
            // Format REST data arrays to Zustand structural maps
            data.forEach((s: any) => {
              sessionMap[s.id] = {
                id: s.id,
                title: s.title,
                model: s.model,
                systemPrompt: s.system_prompt,
                temperature: s.temperature,
                created_at: s.created_at,
                messages: get().sessions[s.id]?.messages || []  // Keep local messages until explicit select session refresh
              };
            });
            
            set({ sessions: sessionMap });
          }
        } catch (e) {
          console.warn('Failed to synchronize sessions index from SQL db:', e);
        }
      },

      createSession: async (title, model) => {
        const id = uuidv4();
        const newSession: Session = {
          id,
          title: title || 'New AI Session',
          messages: [],
          model: model || get().activeModel,
          temperature: 0.7,
          created_at: Date.now(),
        };

        // 1. Commit new session locally in Zustand state
        set((state) => ({
          sessions: { ...state.sessions, [id]: newSession },
          activeSessionId: id,
        }));

        // 2. Synchronize new session row inside server SQL DB
        try {
          await fetch('http://localhost:8000/api/v1/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              title: newSession.title,
              model: newSession.model,
              system_prompt: newSession.systemPrompt || null,
              temperature: newSession.temperature
            })
          });
        } catch (e) {
          console.warn('Failed to commit user session row inside server SQL:', e);
        }

        return id;
      },

      deleteSession: async (id) => {
        // Prune any active websocket connections for this session
        if (activeWebSockets[id]) {
          try {
            activeWebSockets[id].close();
          } catch (e) {}
          delete activeWebSockets[id];
        }

        // 1. Prune from local state
        set((state) => {
          const updatedSessions = { ...state.sessions };
          delete updatedSessions[id];

          let nextActiveId = state.activeSessionId;
          if (state.activeSessionId === id) {
            const keys = Object.keys(updatedSessions);
            nextActiveId = keys.length > 0 ? keys[keys.length - 1] : null;
          }

          return {
            sessions: updatedSessions,
            activeSessionId: nextActiveId,
          };
        });

        // 2. Prune from server SQL DB
        try {
          await fetch(`http://localhost:8000/api/v1/sessions/${id}`, {
            method: 'DELETE'
          });
        } catch (e) {
          console.warn('Failed to cascadingly delete session from server SQL:', e);
        }
      },

      selectSession: async (id) => {
        set({ activeSessionId: id });
        
        // Lazy load conversation message history from SQL DB on focus
        try {
          const res = await fetch(`http://localhost:8000/api/v1/sessions/${id}/messages`);
          if (res.ok) {
            const messages = await res.json();
            
            set((state) => {
              const session = state.sessions[id];
              if (!session) return state;
              
              return {
                sessions: {
                  ...state.sessions,
                  [id]: {
                    ...session,
                    messages: messages.map((m: any) => ({
                      id: m.id,
                      role: m.role,
                      content: m.content,
                      reasoning: m.reasoning,
                      timestamp: m.timestamp
                    }))
                  }
                }
              };
            });
          }
        } catch (e) {
          console.warn(`Failed to lazy load message histories for session ${id}:`, e);
        }
      },

      setInputMessage: (msg) => {
        set({ inputMessage: msg });
      },

      setActiveModel: (model) => {
        set({ activeModel: model });
        const { activeSessionId, sessions } = get();
        if (activeSessionId && sessions[activeSessionId]) {
          set((state) => ({
            sessions: {
              ...state.sessions,
              [activeSessionId]: {
                ...state.sessions[activeSessionId],
                model,
              },
            },
          }));
        }
      },

      clearHistory: (sessionId) => {
        set((state) => {
          if (!state.sessions[sessionId]) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...state.sessions[sessionId],
                messages: [],
              },
            },
          };
        });
      },

      searchMemories: async (query) => {
        if (!query.trim()) {
          set({ searchResults: [] });
          return;
        }

        try {
          const url = `http://localhost:8000/api/v1/memories/search?query=${encodeURIComponent(query)}&workspace=default`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            set({ searchResults: data });
          }
        } catch (e) {
          console.warn('Semantic memory query fetch failed:', e);
        }
      },

      sendMessage: async (promptText) => {
        const { activeSessionId, isStreaming, activeModel, sessions } = get();
        let currentSessionId = activeSessionId;

        if (isStreaming || !promptText.trim()) return;

        // Auto-bootstrap a fresh session if none are selected/active
        if (!currentSessionId || !sessions[currentSessionId]) {
          currentSessionId = await get().createSession(`Session: ${promptText.substring(0, 18)}...`, activeModel);
        }

        const sessionId = currentSessionId as string;
        const userMsgId = uuidv4();
        const assistantMsgId = uuidv4();
        const userTimestamp = Date.now();

        // Create standard message blocks
        const userMessage: Message = {
          id: userMsgId,
          role: 'user',
          content: promptText,
          timestamp: userTimestamp,
        };

        const assistantMessage: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          reasoning: '',
          timestamp: userTimestamp + 50,
        };

        // Append user prompt & empty assistant slot immediately to screen
        set((state) => {
          const session = state.sessions[sessionId];
          const updatedMessages = [...session.messages, userMessage, assistantMessage];
          
          // Auto rename generic session titles
          const isDefaultName = session.title === 'New AI Session';
          const newTitle = isDefaultName ? (promptText.length > 25 ? `${promptText.substring(0, 25)}...` : promptText) : session.title;

          return {
            inputMessage: '',
            isStreaming: true,
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                title: newTitle,
                messages: updatedMessages,
              },
            },
          };
        });

        // Close any dangling connection maps
        if (activeWebSockets[sessionId]) {
          try {
            activeWebSockets[sessionId].close();
          } catch (e) {}
        }

        // Establish real-time WebSocket tunnel
        const wsUrl = `ws://localhost:8000/api/v1/ws/chat/${sessionId}`;
        const ws = new WebSocket(wsUrl);
        activeWebSockets[sessionId] = ws;

        ws.onopen = () => {
          const startEnvelope = {
            id: assistantMsgId,
            type: 'chat.start',
            session: sessionId,
            payload: {
              prompt: promptText,
              model: get().sessions[sessionId].model,
              temperature: get().sessions[sessionId].temperature,
            },
          };
          ws.send(JSON.stringify(startEnvelope));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            // Intercept and route Phase 3 Agent execution events
            if (type && (type.startsWith('agent.') || type === 'permission.prompt')) {
              const agentStore = useAgentStore.getState();
              if (type === 'agent.status') {
                agentStore.setAgentState(payload.state);
              } else if (type === 'agent.dag') {
                agentStore.setTasks(payload.tasks);
              } else if (type === 'agent.thought') {
                agentStore.addLog('thought', payload.content);
              } else if (type === 'agent.action') {
                agentStore.addLog('action', payload.content);
              } else if (type === 'agent.observation') {
                agentStore.addLog('observation', payload.content);
              } else if (type === 'permission.prompt') {
                agentStore.setPendingPermission({
                  id: data.id,
                  tool: payload.tool,
                  arguments: payload.arguments
                });
                agentStore.setAgentState('WAITING');
              }
              return; // Do not append to standard chat session feeds
            }

            set((state) => {
              const session = state.sessions[sessionId];

              if (!session) return state;

              const updatedMessages = session.messages.map((msg) => {
                if (msg.id !== assistantMsgId) return msg;

                if (type === 'chat.thinking' && payload.token) {
                  return {
                    ...msg,
                    reasoning: (msg.reasoning || '') + payload.token,
                  };
                }

                if (type === 'chat.token' && payload.token) {
                  return {
                    ...msg,
                    content: msg.content + payload.token,
                  };
                }

                return msg;
              });

              const streamFinished = type === 'chat.done' || type === 'chat.error';

              if (type === 'chat.error' && payload.message) {
                // Inline rendering of error warnings
                const errorMsgIndex = updatedMessages.findIndex((m) => m.id === assistantMsgId);
                if (errorMsgIndex !== -1) {
                  updatedMessages[errorMsgIndex].content += `\n\n[Inference Failure: ${payload.message}]`;
                }
              }

              return {
                isStreaming: !streamFinished,
                sessions: {
                  ...state.sessions,
                  [sessionId]: {
                    ...session,
                    messages: updatedMessages,
                  },
                },
              };
            });

            if (type === 'chat.done' || type === 'chat.error') {
              ws.close();
              delete activeWebSockets[sessionId];
            }
          } catch (e) {
            console.error('Failed to parse WebSocket incoming frame:', e);
          }
        };

        ws.onerror = (err) => {
          console.error('WebSocket connection errored:', err);
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return { isStreaming: false };

            const updatedMessages = session.messages.map((msg) => {
              if (msg.id === assistantMsgId) {
                return {
                  ...msg,
                  content: msg.content + '\n\n[Gateway Connection Lost: Could not establish a websocket link to local backend.]',
                };
              }
              return msg;
            });

            return {
              isStreaming: false,
              sessions: {
                ...state.sessions,
                [sessionId]: {
                  ...session,
                  messages: updatedMessages,
                },
              },
            };
          });
          delete activeWebSockets[sessionId];
        };

        ws.onclose = () => {
          set({ isStreaming: false });
          delete activeWebSockets[sessionId];
        };
      },

      fetchSystemStatus: async () => {
        try {
          // Fetch provider health statuses
          const statusRes = await fetch('http://localhost:8000/api/v1/system/status');
          if (statusRes.ok) {
            const data = await statusRes.json();
            set({ providers: data.providers || {} });
          }

          // Fetch model inventories
          const modelsRes = await fetch('http://localhost:8000/api/v1/system/models');
          if (modelsRes.ok) {
            const data = await modelsRes.json();
            set({ availableModels: data.models || [] });
          }
        } catch (e) {
          console.warn('System status fetch failed (is backend running locally?):', e);
        }
      },
    }),
    {
      name: 'aetheros-chat-persist-store',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        activeModel: state.activeModel,
      }),
    }
  )
);

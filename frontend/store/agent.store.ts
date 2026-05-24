import { create } from 'zustand';

export interface AgentTask {
  id: string;
  description: string;
  assignee: 'CodingAgent' | 'BrowserAgent' | 'ResearchAgent';
  dependencies: string[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string | null;
}

export interface AgentLog {
  id: string;
  type: 'thought' | 'action' | 'observation';
  content: string;
  timestamp: number;
}

export interface PermissionPrompt {
  id: string;
  tool: string;
  arguments: Record<string, any>;
}

export interface AgentState {
  agentState: 'IDLE' | 'PLANNING' | 'EXECUTING' | 'OBSERVING' | 'WAITING' | 'RETRYING' | 'FAILED' | 'COMPLETED';
  tasks: AgentTask[];
  logs: AgentLog[];
  pendingPermission: PermissionPrompt | null;
  activeGoal: string | null;
  
  // Actions
  setAgentState: (state: AgentState['agentState']) => void;
  setTasks: (tasks: AgentTask[]) => void;
  addLog: (type: AgentLog['type'], content: string) => void;
  setPendingPermission: (permission: PermissionPrompt | null) => void;
  clearAgent: () => void;
  
  // Trigger actions
  triggerAgentGoal: (sessionId: string, goal: string, model: string) => Promise<void>;
  resolvePermission: (promptId: string, approved: boolean) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agentState: 'IDLE',
  tasks: [],
  logs: [],
  pendingPermission: null,
  activeGoal: null,

  setAgentState: (agentState) => set({ agentState }),
  setTasks: (tasks) => set({ tasks }),
  
  addLog: (type, content) => {
    const newLog: AgentLog = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      content,
      timestamp: Date.now(),
    };
    set((state) => ({ logs: [...state.logs, newLog] }));
  },
  
  setPendingPermission: (pendingPermission) => set({ pendingPermission }),
  
  clearAgent: () => set({
    agentState: 'IDLE',
    tasks: [],
    logs: [],
    pendingPermission: null,
    activeGoal: null,
  }),

  triggerAgentGoal: async (sessionId, goal, model) => {
    get().clearAgent();
    set({ activeGoal: goal, agentState: 'PLANNING' });
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          goal,
          model,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to start agent execution.');
      }
    } catch (e: any) {
      console.error('Failed to trigger AetherOS agent execution:', e);
      set({ agentState: 'FAILED' });
      get().addLog('observation', `✗ Failed to trigger agent execution: ${e.message}`);
    }
  },

  resolvePermission: async (promptId, approved) => {
    // Clear pending approval instantly in UI
    set({ pendingPermission: null });
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/agents/permission/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: promptId,
          approved,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to resolve permission.');
      }
    } catch (e: any) {
      console.error('Failed to dispatch permission resolution:', e);
      get().addLog('observation', `✗ Permission dispatch failed: ${e.message}`);
    }
  },
}));

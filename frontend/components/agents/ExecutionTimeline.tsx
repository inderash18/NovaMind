import React from 'react';
import { useAgentStore, AgentTask } from '../../store/agent.store';

export default function ExecutionTimeline() {
  const { tasks, agentState, activeGoal } = useAgentStore();

  if (agentState === 'IDLE' || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#6B7280] p-8 text-center bg-[#161b22]/40 border border-white/[0.04] rounded-lg select-none">
        <svg className="w-8 h-8 mb-2.5 text-[#6B7280]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-xs font-semibold text-[#f0f6fc] mb-1">No Active Operations</h3>
        <p className="text-[10px] text-[#6B7280] max-w-xs leading-relaxed">
          The sandboxed execution feed and active workflow milestones will compile here once a task goal is triggered.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: AgentTask['status']) => {
    switch (status) {
      case 'completed': return 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20';
      case 'executing': return 'text-[#d29922] bg-[#d29922]/10 border-[#d29922]/20 animate-pulse';
      case 'failed': return 'text-[#f85149] bg-[#f85149]/10 border-[#f85149]/20';
      default: return 'text-[#8b949e] bg-[#161b22] border-white/[0.06]';
    }
  };

  const getSystemStatusLabel = (state: string) => {
    switch (state) {
      case 'PLANNING': return 'bg-[#388bfd]/10 text-[#388bfd] border-[#388bfd]/20';
      case 'EXECUTING': return 'bg-[#d29922]/10 text-[#d29922] border-[#d29922]/20';
      case 'OBSERVING': return 'bg-[#a371f7]/10 text-[#a371f7] border-[#a371f7]/20';
      case 'WAITING': return 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20 animate-pulse';
      case 'COMPLETED': return 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/20';
      case 'FAILED': return 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20';
      default: return 'bg-[#161b22] text-[#8b949e] border-white/[0.06]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161b22]/40 border border-white/[0.06] rounded-lg overflow-hidden font-sans relative">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-[#161b22]/20 select-none shrink-0 z-10">
        <div className="min-w-0 pr-4">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#f0f6fc]">
              Workflow Activity Feed
            </span>
          </div>
          <p className="text-[9px] text-[#6b7280] mt-0.5 truncate font-mono">
            {activeGoal}
          </p>
        </div>

        <div className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${getSystemStatusLabel(agentState)} transition-all duration-150`}>
          {agentState}
        </div>
      </div>

      {/* Structured workflow list feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0b0d13]/10 relative z-10">
        {tasks.map((task, idx) => {
          
          return (
            <div key={task.id} className="relative flex items-start space-x-3.5 group">
              
              {/* 
                 ORGANIC BEZIER GRADIENCY PATH CONNECTOR (Gyanaguru visual reference)
                 Sweeps from status bulb, curves outward sideways and converges perfectly down.
              */}
              {idx < tasks.length - 1 && (
                <svg className="absolute left-[8px] top-[22px] w-[50px] h-[55px] pointer-events-none select-none z-0 overflow-visible">
                  <defs>
                    <linearGradient id={`grad-${task.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={task.status === 'completed' ? '#3fb950' : '#388bfd'} stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#a371f7" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M 1,0 C 1,18 20,18 20,32 C 20,44 1,44 1,56" 
                    fill="none" 
                    stroke={`url(#grad-${task.id})`}
                    strokeWidth={1.5}
                    strokeDasharray={task.status === 'pending' ? '3,3' : 'none'}
                  />
                </svg>
              )}

              {/* Status bulb indicator */}
              <div className="relative z-10 flex items-center justify-center mt-1 flex-shrink-0 select-none">
                {task.status === 'completed' && (
                  <div className="w-[19px] h-[19px] rounded-full bg-[#3fb950]/15 border border-[#3fb950]/30 flex items-center justify-center text-[#3fb950]">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {task.status === 'executing' && (
                  <div className="w-[19px] h-[19px] rounded-full bg-[#d29922]/15 border border-[#d29922]/30 flex items-center justify-center text-[#d29922]">
                    <div className="w-2.5 h-2.5 border border-t-transparent border-current rounded-full animate-spin"></div>
                  </div>
                )}
                {task.status === 'failed' && (
                  <div className="w-[19px] h-[19px] rounded-full bg-[#f85149]/15 border border-[#f85149]/30 flex items-center justify-center text-[#f85149]">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {task.status === 'pending' && (
                  <div className="w-[19px] h-[19px] rounded-full bg-[#161b22] border border-white/[0.06] flex items-center justify-center text-[#8b949e]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#30363d]"></div>
                  </div>
                )}
              </div>

              {/* Task Details Card - Styled in sleek glass outlines */}
              <div className={`flex-1 min-w-0 p-3 rounded-lg border bg-[#161b22]/30 transition-all duration-150 relative overflow-hidden ${
                task.status === 'executing' ? 'border-[#388bfd]/30 bg-[#1d2430]/20' : 'border-white/[0.04]'
              } hover:bg-[#161b22]/50 shadow-sm`}>
                
                {/* Thin, elegant status accent line in executing state */}
                {task.status === 'executing' && (
                  <div className="absolute inset-y-0 left-0 w-[2px] bg-[#d29922]"></div>
                )}

                <div className="flex items-center justify-between gap-2 select-none">
                  <span className="text-[10px] font-mono text-[#8b949e] font-medium">{task.id}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wider bg-[#1d2430] text-[#8b949e] border border-white/[0.04]">
                    {task.assignee}
                  </span>
                </div>
                
                <p className="text-xs text-[#f0f6fc]/90 font-sans mt-1.5 leading-relaxed select-text">
                  {task.description}
                </p>

                {/* Error Display */}
                {task.error && (
                  <div className="mt-2 text-[10px] font-mono text-[#f85149] bg-[#f85149]/5 p-2 border border-[#f85149]/10 rounded select-text">
                    {task.error}
                  </div>
                )}

                {/* Dependencies */}
                {task.dependencies.length > 0 && (
                  <div className="mt-2.5 flex items-center space-x-1.5 overflow-x-auto select-none">
                    <span className="text-[8px] font-bold text-[#484f58] uppercase tracking-wider font-mono">Requires:</span>
                    {task.dependencies.map(dep => (
                      <span key={dep} className="text-[8px] font-mono bg-[#1d2430] text-[#8b949e] px-1.5 py-0.5 rounded border border-white/[0.04]">
                        {dep}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

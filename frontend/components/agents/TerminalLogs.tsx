import React, { useEffect, useRef, useState } from 'react';
import { useAgentStore, AgentLog } from '../../store/agent.store';

export default function TerminalLogs() {
  const { logs, agentState } = useAgentStore();
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, autoScroll]);

  if (agentState === 'IDLE' && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#6B7280] p-8 text-center bg-[#161B22]/40 border border-white/[0.04] rounded-lg select-none">
        <svg className="w-8 h-8 mb-2.5 text-[#6B7280]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xs font-semibold text-[#F5F7FA] mb-1">Log Feed Silent</h3>
        <p className="text-[10px] text-[#6B7280] max-w-xs leading-relaxed">
          Standard stdout command logs, code execution logs, and linter events will stream here sequentially.
        </p>
      </div>
    );
  }

  // Filter logs by search query dynamically
  const filteredLogs = logs.filter(log => 
    log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0F1115] border border-white/[0.06] rounded-lg overflow-hidden font-mono text-[11px] relative shadow-md">
      
      {/* Search & Controller Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161B22] border-b border-white/[0.06] select-none z-10">
        <div className="flex items-center space-x-2 flex-1 max-w-[200px]">
          <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Console Logs</span>
        </div>
        
        {/* Dynamic Log Filter Search input */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="bg-[#0F1115] border border-white/[0.04] focus:border-[#6366F1]/45 rounded px-2 py-0.5 text-[10px] text-[#F5F7FA] placeholder-slate-600 outline-none w-32 focus:w-44 transition-all duration-150"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1 text-[#6B7280] hover:text-[#F5F7FA]"
              >
                ×
              </button>
            )}
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors cursor-pointer ${
              autoScroll 
                ? 'bg-[#6366F1]/10 border-[#6366F1]/20 text-[#6366F1]' 
                : 'bg-transparent border-white/[0.06] text-[#6B7280] hover:text-[#9AA4B2]'
            }`}
            title="Toggle Auto Scroll"
          >
            SCROLL
          </button>
        </div>
      </div>

      {/* Modern Developer Log Stream viewport */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#0F1115] custom-scrollbar select-text selection:bg-[#6366F1]/30">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-6 text-[#6B7280] italic select-none">
            No matching console logs located
          </div>
        ) : (
          filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            return (
              <div key={log.id} className="flex flex-col space-y-0.5 hover:bg-white/[0.01] px-1 py-0.5 rounded transition-all duration-100">
                {/* Meta details header line */}
                <div className="flex items-center justify-between text-[9px] text-[#6B7280] font-sans pb-0.5 border-b border-white/[0.02]">
                  <span className="font-bold tracking-wider select-none flex items-center space-x-1.5">
                    {log.type === 'thought' && <span className="text-[#818CF8]">💡 REASONING</span>}
                    {log.type === 'action' && <span className="text-[#F59E0B]">⚙️ DISPATCHED TOOL</span>}
                    {log.type === 'observation' && <span className="text-[#22C55E]">✓ OBSERVATION</span>}
                  </span>
                  <span className="select-none font-mono text-[8px]">{timeStr}</span>
                </div>

                {/* Log Text block container */}
                <div className="pl-1 pt-1">
                  {log.type === 'thought' && (
                    <p className="text-[#9AA4B2]/90 leading-relaxed font-sans text-xs italic pl-2 border-l border-white/[0.06]">
                      {log.content}
                    </p>
                  )}

                  {log.type === 'action' && (
                    <div className="bg-[#161B22] border border-white/[0.04] p-2 rounded text-[#F5F7FA] text-[10px] break-all leading-normal flex items-start space-x-1.5 select-all">
                      <span className="text-[#6B7280] font-bold select-none">$</span>
                      <pre className="whitespace-pre-wrap font-mono break-all pr-1">{log.content}</pre>
                    </div>
                  )}

                  {log.type === 'observation' && (
                    <div className="bg-[#0F1115]/40 border border-white/[0.03] p-2.5 rounded text-[#9AA4B2] text-[10px] leading-relaxed select-all">
                      <pre className="whitespace-pre-wrap font-mono break-all text-[#9AA4B2] leading-normal">{log.content}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}

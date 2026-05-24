"use client";

import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error';
  description: string;
  tasksDone: number;
  uptime: string;
  memory: string;
  toolAccess: string[];
  logs: { type: 'stdout' | 'stderr' | 'info' | 'reasoning'; text: string; time: string }[];
}

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState('coding-agent');
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'coding-agent',
      name: 'CodingAgent',
      status: 'running',
      description: 'Executes repository file reads/writes, parses AST trees, and runs compile static checks securely inside sandboxed worker containers.',
      tasksDone: 24,
      uptime: '1h 42m',
      memory: '42.6 MB',
      toolAccess: ['read_file', 'write_file', 'ast_parse', 'execute_code'],
      logs: [
        { type: 'info', text: 'Initializing CodingAgent sandbox lifecycle...', time: '19:40:02' },
        { type: 'stdout', text: 'Statically parsing AST syntax trees for MathSorter: valid python 3.11 syntax.', time: '19:40:05' },
        { type: 'stdout', text: 'Writing 312 bytes to safe workspace path: math_sorter.py', time: '19:40:06' },
        { type: 'info', text: 'Sandbox verifying file existence and executing shell...', time: '19:40:08' },
        { type: 'stdout', text: 'Sorted Array: [11, 12, 22, 25, 34, 64, 90] in 0.0452ms', time: '19:40:12' },
        { type: 'reasoning', text: 'Reflecting on bubble sort latency parameters. The execution time matches expected O(n^2) boundaries for short inputs.', time: '19:40:15' }
      ]
    },
    {
      id: 'browser-agent',
      name: 'BrowserAgent',
      status: 'idle',
      description: 'Navigates web endpoints securely, extracts plain readable markdown text blocks, and searches duckduckgo queries.',
      tasksDone: 14,
      uptime: '45m',
      memory: '128.4 MB',
      toolAccess: ['web_scrape', 'url_fetch', 'duckduckgo_search'],
      logs: [
        { type: 'info', text: 'Initializing headless chromium viewport layers...', time: '19:45:01' },
        { type: 'stdout', text: 'Playwright navigates to https://html.duckduckgo.com/html/?q=AetherOS', time: '19:45:04' },
        { type: 'stdout', text: 'Scraping result snippets: found 5 relevant local-first AI guides.', time: '19:45:08' },
        { type: 'info', text: 'Closing browser session pools.', time: '19:45:10' }
      ]
    },
    {
      id: 'research-agent',
      name: 'ResearchAgent',
      status: 'error',
      description: 'Crawls local sqlite indices, compiles long-form markdown fact files, and queries vector model similarity matches.',
      tasksDone: 8,
      uptime: '12m',
      memory: '64.2 MB',
      toolAccess: ['vector_search', 'sqlite_read', 'summarize_fact'],
      logs: [
        { type: 'info', text: 'Loading semantic database index...', time: '19:30:02' },
        { type: 'stderr', text: 'Index Connection Error: Vector container offline or socket address failed.', time: '19:30:05' },
        { type: 'info', text: 'Retrying semantic facts load with fallbacks...', time: '19:30:10' }
      ]
    }
  ]);

  const handleToggleAgent = (id: string) => {
    setAgents(agents.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: a.status === 'running' ? 'idle' : 'running'
        };
      }
      return a;
    }));
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden select-text p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none">
        <h2 className="text-[15px] font-bold tracking-tight uppercase text-[#f9fafb]">Agent Control Center</h2>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">Autonomous ReAct executor modules, sandboxed runtime environments, and permissions logs.</p>
      </header>

      {/* Primary Grid Layout */}
      <div className="flex-grow flex flex-col lg:flex-row gap-5 min-h-0">
        
        {/* Left Column: Modular Cards */}
        <div className="flex-1 lg:flex-[4] flex flex-col space-y-3.5 overflow-y-auto pr-1 select-none">
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            const isRunning = agent.status === 'running';

            return (
              <div 
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`bg-[#111827] border rounded-xl p-4 flex flex-col justify-between shadow-sm cursor-pointer transition-all duration-150 ${
                  isSelected ? 'border-[#3b82f6] bg-[#111827]/90' : 'border-[#1f2937] hover:border-[#374151]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12.5px] font-bold text-[#f9fafb]">{agent.name}</h3>
                    
                    {/* Status badge */}
                    <span className="text-[10px] font-mono select-none">
                      {agent.status === 'running' && (
                        <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold uppercase tracking-wide border border-[#10b981]/20">
                          Active
                        </span>
                      )}
                      {agent.status === 'idle' && (
                        <span className="px-2 py-0.5 rounded bg-[#1f2937] text-[#6b7280] font-bold uppercase tracking-wide border border-[#1f2937]">
                          Standby
                        </span>
                      )}
                      {agent.status === 'error' && (
                        <span className="px-2 py-0.5 rounded bg-[#ef4444]/15 text-[#ef4444] font-bold uppercase tracking-wide border border-[#ef4444]/20 animate-pulse">
                          Alert
                        </span>
                      )}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-[#9ca3af] leading-relaxed mt-2.5 line-clamp-2 select-text">
                    {agent.description}
                  </p>

                  {/* Tool chips */}
                  <div className="mt-3 flex flex-wrap gap-1 select-none">
                    {agent.toolAccess.map(t => (
                      <span key={t} className="text-[8.5px] font-mono bg-[#0b0f19] text-[#6b7280] px-1.5 py-0.5 rounded border border-[#1f2937]">{t}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#1f2937] flex items-center justify-between text-[10.5px] text-[#6b7280] select-none">
                  <div className="flex space-x-3.5 font-mono">
                    <span>Tasks: <strong className="text-[#9ca3af] font-semibold">{agent.tasksDone}</strong></span>
                    <span>Mem: <strong className="text-[#9ca3af] font-semibold">{agent.memory}</strong></span>
                  </div>
                  
                  {/* Start/Stop Controls */}
                  <div className="flex items-center space-x-2 select-none">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAgent(agent.id);
                      }}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                        isRunning 
                          ? 'bg-[#ef4444]/15 hover:bg-[#ef4444]/25 text-[#ef4444] border-[#ef4444]/25'
                          : 'bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/20'
                      }`}
                    >
                      {isRunning ? 'Stop' : 'Start'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Console logs panel */}
        <div className="flex-1 lg:flex-[6] flex flex-col min-h-0 bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
          
          {/* Windows title tab */}
          <div className="px-4 py-3 border-b border-[#1f2937] bg-[#111827]/40 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] opacity-80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] opacity-80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] opacity-80"></span>
              <span className="text-[10px] font-mono text-[#6b7280] pl-2 font-semibold">
                stdout/{selectedAgent.id}.log
              </span>
            </div>
            
            <span className="text-[9.5px] text-[#6b7280] font-mono select-none">
              Uptime: {selectedAgent.uptime}
            </span>
          </div>

          {/* Monospaced stderr/stdout terminal logger */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0b0f19] custom-scrollbar text-[11px] font-mono leading-relaxed">
            {selectedAgent.logs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <span className="text-[#374151] select-none">{log.time}</span>
                <div className="flex-1 select-text">
                  {log.type === 'stdout' && (
                    <span className="text-[#f9fafb]">{log.text}</span>
                  )}
                  {log.type === 'stderr' && (
                    <span className="text-[#ef4444] font-semibold">{log.text}</span>
                  )}
                  {log.type === 'info' && (
                    <span className="text-[#6b7280]">{log.text}</span>
                  )}
                  {log.type === 'reasoning' && (
                    <span className="text-[#8b5cf6] italic opacity-85">{log.text}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}

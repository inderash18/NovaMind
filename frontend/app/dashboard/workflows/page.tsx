"use client";

import React, { useState } from 'react';

interface WorkflowNode {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'filter' | 'outcome';
  status: 'active' | 'inactive';
  description: string;
}

export default function WorkflowsPage() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: 'node-1', name: 'Timer cron schedule', type: 'trigger', status: 'active', description: 'Triggers daily at 08:00 AM UTC autonomously.' },
    { id: 'node-2', name: 'Fetch Research Papers', type: 'action', status: 'active', description: 'Queries bioRxiv for latest agentic system preprints.' },
    { id: 'node-3', name: 'Summarization Filter', type: 'filter', status: 'active', description: 'Summarizes key findings to under 250 words per model.' },
    { id: 'node-4', name: 'Vector Store Memory', type: 'action', status: 'active', description: 'Persists findings directly to ChromaDB semantic memory.' },
    { id: 'node-5', name: 'Secure Email Alert', type: 'outcome', status: 'inactive', description: 'Emails PDF fact list summary using automated SMTP nodes.' }
  ]);

  const handleToggleNode = (id: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, status: n.status === 'active' ? 'inactive' : 'active' } : n));
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden select-text p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none">
        <h2 className="text-[15px] font-bold uppercase tracking-tight text-[#f9fafb]">Workflows Orchestrator</h2>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">Define automated local cognitive task loops, custom cron schedules, and file analysis pipelines.</p>
      </header>

      {/* Grid container */}
      <div className="flex-grow overflow-y-auto pr-1 select-none">
        
        {/* Flowchart Node Cards */}
        <div className="max-w-4xl space-y-4 relative">
          
          {nodes.map((node, index) => {
            const isActive = node.status === 'active';
            return (
              <div key={node.id} className="relative flex items-center group">
                
                {/* Visual SVG Connecting Fiber Path between steps */}
                {index < nodes.length - 1 && (
                  <div className="absolute left-6.5 top-11.5 w-[2px] h-6.5 bg-[#1f2937] group-hover:bg-[#3b82f6]/40 transition-colors z-0"></div>
                )}

                {/* Node bubble status identifier */}
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center relative z-10 font-mono text-[10.5px] font-bold transition-all shrink-0 ${
                  isActive 
                    ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/25'
                    : 'bg-[#111827] text-[#6b7280] border-[#1f2937]'
                }`}>
                  {index + 1}
                </div>

                {/* Main Node Card block */}
                <div className={`ml-4 flex-1 bg-[#111827] border rounded-xl p-3.5 flex items-center justify-between shadow-sm transition-all ${
                  isActive ? 'border-[#1f2937]' : 'border-[#1f2937]/40 opacity-70'
                }`}>
                  <div className="pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-[12.5px] font-bold text-[#f9fafb]">{node.name}</span>
                      <span className={`text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-semibold ${
                        node.type === 'trigger' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                        node.type === 'action' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' :
                        node.type === 'filter' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]' : 'bg-[#10b981]/10 text-[#10b981]'
                      }`}>
                        {node.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9ca3af] mt-1.5 leading-relaxed select-text">{node.description}</p>
                  </div>

                  <button 
                    onClick={() => handleToggleNode(node.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors shrink-0 ${
                      isActive 
                        ? 'bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/25'
                        : 'bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border-[#10b981]/25'
                    }`}
                  >
                    {isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}

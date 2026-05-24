"use client";

import React, { useState } from 'react';

interface MemoryDocument {
  id: string;
  content: string;
  source: string;
  timestamp: string;
  tokens: number;
}

export default function MemoryPage() {
  const [filterQuery, setFilterQuery] = useState('');
  const [memories, setMemories] = useState<MemoryDocument[]>([
    { id: 'mem-1', content: 'MathSorter Bubble Sort latency operates under expected O(n^2) boundary logs.', source: 'CodingAgent', timestamp: '2026-05-24 19:40:15', tokens: 18 },
    { id: 'mem-2', content: 'Headless chromium browser sandbox mount checks successfully bypassed.', source: 'BrowserAgent', timestamp: '2026-05-24 19:45:08', tokens: 22 },
    { id: 'mem-3', content: 'sqlite local database config keys active for safe scratch records storage.', source: 'Supervisor', timestamp: '2026-05-24 19:30:02', tokens: 16 },
    { id: 'mem-4', content: 'AetherOS Sovereign configuration parameters settings Pydantic settings.', source: 'SettingsConfig', timestamp: '2026-05-24 14:55:07', tokens: 14 }
  ]);

  const handleDestroyMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
  };

  const filteredMemories = memories.filter(m => 
    m.content.toLowerCase().includes(filterQuery.toLowerCase()) || 
    m.source.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden select-text p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none">
        <h2 className="text-[15px] font-bold uppercase tracking-tight text-[#f9fafb]">Sovereign Memory Engine</h2>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">Browse localized semantic vector database indexes, token embeddings, and cognitive memories.</p>
      </header>

      {/* Embedding Info Banner */}
      <section className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl mb-5 shrink-0 select-none flex flex-wrap gap-6 items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H3.75A1.5 1.5 0 002.25 3.75v16.5A1.5 1.5 0 003.75 21.75h16.5a1.5 1.5 0 001.5-1.5V17.25a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          </div>
          <div>
            <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-widest font-mono">Active Embedder:</span>
            <div className="text-[12.5px] font-bold text-[#f9fafb] mt-0.5">nomic-embed-text (Local Node)</div>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-[11px] font-mono text-[#6b7280] shrink-0">
          <div>Dimension: <strong className="text-[#9ca3af] font-semibold">768 floats</strong></div>
          <div>Total Documents: <strong className="text-[#9ca3af] font-semibold">{memories.length}</strong></div>
        </div>
      </section>

      {/* Memory Panel sheet */}
      <section className="flex-grow flex flex-col min-h-0 bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
        
        {/* Search header */}
        <div className="p-4 border-b border-[#1f2937] bg-[#111827]/40 select-none">
          <input 
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search cognitive memory indexes by keyword..."
            className="w-full max-w-md bg-[#0b0f19] border border-[#1f2937] focus:border-[#3b82f6] rounded-lg px-3 py-1.5 text-xs text-[#f9fafb] placeholder-[#6b7280] outline-none transition-colors"
          />
        </div>

        {/* Data list viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11.5px]">
            <thead>
              <tr className="h-9 border-b border-[#1f2937] bg-[#111827]/20 text-[9px] font-bold text-[#6b7280] uppercase tracking-wider select-none">
                <th className="pl-5 pr-4 font-bold">Document Content Summary</th>
                <th className="px-4 font-bold">Origin Agent</th>
                <th className="px-4 font-bold">Size</th>
                <th className="px-4 font-bold">Saved Time</th>
                <th className="pr-5 pl-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]/50 text-xs">
              {filteredMemories.map((mem) => (
                <tr key={mem.id} className="hover:bg-[#1f2937]/20 transition-colors h-12">
                  <td className="pl-5 pr-4 text-[#f9fafb] font-sans leading-relaxed select-all py-2 max-w-lg">{mem.content}</td>
                  <td className="px-4">
                    <span className="text-[9.5px] font-mono bg-[#0b0f19] text-[#9ca3af] px-1.5 py-0.5 rounded border border-[#1f2937]">{mem.source}</span>
                  </td>
                  <td className="px-4 font-mono text-[#6b7280]">{mem.tokens} tokens</td>
                  <td className="px-4 font-mono text-[#6b7280]">{mem.timestamp}</td>
                  <td className="pr-5 pl-4 text-right select-none">
                    <button 
                      onClick={() => handleDestroyMemory(mem.id)}
                      className="text-[11px] font-bold text-[#6b7280] hover:text-[#ef4444] transition-colors cursor-pointer"
                    >
                      Destroy
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMemories.length === 0 && (
                <tr className="select-none">
                  <td colSpan={5} className="text-center py-8 text-[#6b7280] italic">No vector memory matches found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
}

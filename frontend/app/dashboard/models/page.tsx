"use client";

import React, { useState } from 'react';

interface LoadedModel {
  id: string;
  name: string;
  provider: string;
  vram: number; // GB
  speed: string; // tok/s
  status: 'active' | 'loaded';
}

export default function ModelsPage() {
  const [activeModelId, setActiveModelId] = useState('qwen-7b');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortingAsc, setIsSortingAsc] = useState(true);

  const initialModels: LoadedModel[] = [
    { id: 'qwen-7b', name: 'qwen2.5-7b-instruct', provider: 'Ollama', vram: 4.8, speed: '48.2 tok/s', status: 'active' },
    { id: 'llama-8b', name: 'llama3-8b-instruct.Q4_K_M', provider: 'Ollama', vram: 5.6, speed: '42.5 tok/s', status: 'loaded' },
    { id: 'mistral-7b', name: 'mistral-7b-instruct', provider: 'LM Studio', vram: 4.2, speed: '44.8 tok/s', status: 'loaded' }
  ];

  const [models, setModels] = useState<LoadedModel[]>(initialModels);

  const totalVRAM = 16.0;
  const VRAMUsed = models.reduce((acc, m) => acc + m.vram, 0);

  const handleUnload = (id: string) => {
    setModels(models.filter(m => m.id !== id));
  };

  const handleSetActive = (id: string) => {
    setActiveModelId(id);
    setModels(models.map(m => ({
      ...m,
      status: m.id === id ? 'active' : 'loaded'
    })));
  };

  const handleSort = () => {
    setIsSortingAsc(!isSortingAsc);
    const sorted = [...models].sort((a, b) => {
      return isSortingAsc ? a.vram - b.vram : b.vram - a.vram;
    });
    setModels(sorted);
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden select-text p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none">
        <h2 className="text-[15px] font-bold uppercase tracking-tight text-[#f9fafb]">Model Registry</h2>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">Manage local weights memory distributions, sort loaded weights, and pull new models.</p>
      </header>

      {/* VRAM Summary Bar */}
      <section className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 mb-5 shrink-0 select-none shadow-sm">
        <div className="flex justify-between items-center text-[11px] font-mono text-[#9ca3af] mb-3 select-none">
          <span>Local Memory Pool (VRAM)</span>
          <span className="font-semibold text-[#f9fafb]">{VRAMUsed.toFixed(1)} GB / {totalVRAM.toFixed(1)} GB Allocated</span>
        </div>

        {/* 6px height track */}
        <div className="h-1.5 w-full bg-[#0b0f19] rounded-full overflow-hidden flex select-none">
          {models.map((m, idx) => {
            const pct = (m.vram / totalVRAM) * 100;
            const colors = ['bg-[#3b82f6]', 'bg-[#8b5cf6]', 'bg-[#6366f1]'];
            return (
              <div 
                key={m.id} 
                style={{ width: `${pct}%` }} 
                className={`${colors[idx % colors.length]} h-full`}
                title={`${m.name}: ${m.vram} GB`}
              ></div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center space-x-5 flex-wrap select-none">
          {models.map((m, idx) => {
            const colors = ['bg-[#3b82f6]', 'bg-[#8b5cf6]', 'bg-[#6366f1]'];
            return (
              <div key={m.id} className="flex items-center space-x-2 text-[10.5px] text-[#6b7280]">
                <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`}></span>
                <span className="font-bold text-[#f9fafb]">{m.name}</span>
                <span>({m.vram} GB)</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Model table section */}
      <section className="flex-grow flex flex-col min-h-0 bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11.5px]">
            <thead>
              <tr className="h-9.5 border-b border-[#1f2937] bg-[#111827]/40 text-[9px] font-bold text-[#6b7280] uppercase tracking-wider select-none">
                <th className="pl-5 pr-4 font-bold">Model ID / Name</th>
                <th className="px-4 font-bold">Provider</th>
                <th className="px-4 font-bold cursor-pointer hover:text-[#f9fafb] transition-colors" onClick={handleSort}>
                  VRAM Allocation <span className="text-[10px] font-normal">{isSortingAsc ? '↑' : '↓'}</span>
                </th>
                <th className="px-4 font-bold">Speed Index</th>
                <th className="px-4 font-bold">Status</th>
                <th className="pr-5 pl-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]/50 text-xs">
              {models.map((m) => {
                const isActive = m.status === 'active';
                return (
                  <tr 
                    key={m.id} 
                    className="h-11 hover:bg-[#1f2937]/20 transition-colors"
                  >
                    <td className="pl-5 pr-4 font-mono font-medium text-[#f9fafb] select-all">{m.name}</td>
                    <td className="px-4 text-[#9ca3af]">{m.provider}</td>
                    <td className="px-4 font-mono text-[#6b7280]">{m.vram.toFixed(1)} GB</td>
                    <td className="px-4 font-mono text-[#6b7280]">{m.speed}</td>
                    <td className="px-4">
                      <div className="flex items-center space-x-1.5 select-none">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#10b981]' : 'bg-[#3b82f6]'}`}></span>
                        <span className="text-[11px] font-medium text-[#9ca3af]">
                          {isActive ? 'active' : 'loaded'}
                        </span>
                      </div>
                    </td>
                    <td className="pr-5 pl-4 text-right select-none space-x-4">
                      {!isActive && (
                        <button 
                          onClick={() => handleSetActive(m.id)}
                          className="text-[11px] font-bold text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                      <button 
                        onClick={() => handleUnload(m.id)}
                        className="text-[11px] font-bold text-[#6b7280] hover:text-[#ef4444] transition-colors cursor-pointer"
                      >
                        Unload
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom row: Pull new model search bar */}
        <div className="p-4 border-t border-[#1f2937] bg-[#111827]/40 select-none">
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center space-x-3 max-w-lg">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search HuggingFace / Ollama weights library..."
                className="w-full bg-[#0b0f19] border border-[#1f2937] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-xs text-[#f9fafb] placeholder-[#6b7280] outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white px-3.5 h-8.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              + Pull new model
            </button>
          </form>
        </div>

      </section>

    </div>
  );
}

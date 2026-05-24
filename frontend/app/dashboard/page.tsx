"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chat.store';

interface Metric {
  title: string;
  value: string;
  status: 'healthy' | 'warning' | 'standby';
  sparkline: number[];
  color: string;
}

interface RegistryModel {
  name: string;
  provider: string;
  contextSize: string;
  vram: string;
  status: 'active' | 'loaded' | 'available';
  speed: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { providers, availableModels, activeModel, setActiveModel, fetchSystemStatus } = useChatStore();

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  const ollama = providers['ollama'] || { status: 'offline' };
  const isOllamaOnline = ollama.status === 'healthy';

  // Saturated metrics dataset
  const metrics: Metric[] = [
    { title: "CPU core load", value: "18.4%", status: "healthy", sparkline: [12, 14, 18, 15, 22, 19, 17, 24, 18], color: "#3b82f6" },
    { title: "RAM distribution", value: "7.2 GB / 32 GB", status: "healthy", sparkline: [7.0, 7.1, 7.2, 7.2, 7.1, 7.2, 7.2, 7.3, 7.2], color: "#10b981" },
    { title: "GPU core cluster", value: "32.0%", status: "healthy", sparkline: [25, 30, 42, 28, 48, 35, 30, 52, 32], color: "#8b5cf6" },
    { title: "System VRAM pool", value: "4.8 GB / 16 GB", status: "healthy", sparkline: [4.8, 4.8, 4.8, 4.8, 4.8, 4.8, 4.8, 4.8, 4.8], color: "#a855f7" },
    { title: "Active agent nodes", value: "3 running", status: "healthy", sparkline: [2, 2, 3, 3, 3, 3, 3, 3, 3], color: "#6366f1" },
    { title: "Active model weights", value: "1 loaded", status: "healthy", sparkline: [1, 1, 1, 1, 1, 1, 1, 1, 1], color: "#3b82f6" },
    { title: "Vector persistent db", value: "4,821 hashes", status: "healthy", sparkline: [4200, 4350, 4500, 4610, 4700, 4750, 4800, 4821, 4821], color: "#10b981" },
    { title: "API Gateway routing rates", value: "14.req/s", status: "healthy", sparkline: [10, 12, 15, 14, 13, 15, 12, 16, 14.2], color: "#8b5cf6" }
  ];

  const modelsRegistry: RegistryModel[] = [
    { name: "qwen2.5-7b", provider: "Ollama", contextSize: "32k tokens", vram: "4.8 GB", status: "active", speed: "45.2 tok/s" },
    { name: "llama3-8b", provider: "Ollama", contextSize: "8k tokens", vram: "5.4 GB", status: "loaded", speed: "38.6 tok/s" },
    { name: "mistral-7b", provider: "Ollama", contextSize: "8k tokens", vram: "4.1 GB", status: "available", speed: "42.0 tok/s" },
    { name: "phi3-mini", provider: "Ollama", contextSize: "4k tokens", vram: "2.2 GB", status: "available", speed: "65.4 tok/s" },
  ];

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-y-auto p-6 font-sans select-text custom-scrollbar">
      
      {/* Header */}
      <header className="mb-6 shrink-0 select-none flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight uppercase text-[#f9fafb]">Workstation Dashboard</h2>
          <p className="text-[11px] text-[#9ca3af] mt-0.5">Sovereign Local-First AI Runtime and Autonomous Orchestration Center.</p>
        </div>
        
        {/* Ollama status badge */}
        <div className="flex items-center space-x-2 bg-[#111827] border border-[#1f2937] px-3 py-1 rounded-lg text-[10.5px] font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${isOllamaOnline ? 'bg-[#10b981] animate-pulse' : 'bg-[#ef4444]'}`}></span>
          <span className="text-[#9ca3af]">Ollama Provider:</span>
          <span className={isOllamaOnline ? 'text-[#10b981] font-semibold' : 'text-[#ef4444] font-semibold'}>
            {isOllamaOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </header>

      {/* Metrics Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none shrink-0">
        {metrics.map((metric, idx) => {
          // simple inline sparkline SVG generator
          const maxVal = Math.max(...metric.sparkline);
          const minVal = Math.min(...metric.sparkline);
          const range = maxVal - minVal || 1;
          const points = metric.sparkline.map((val, i) => {
            const x = (i / (metric.sparkline.length - 1)) * 100;
            const y = 30 - ((val - minVal) / range) * 25;
            return `${x},${y}`;
          }).join(' ');

          return (
            <div key={idx} className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[#9ca3af] tracking-wider font-mono">{metric.title}</span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]"></span>
                </span>
              </div>
              
              <div className="flex items-end justify-between mt-3">
                <span className="text-[18px] font-bold tracking-tight text-[#f9fafb] font-sans">{metric.value}</span>
                
                {/* SVG Mini Sparkline */}
                <svg className="w-[80px] h-[30px]" viewBox="0 0 100 30">
                  <polyline
                    fill="none"
                    stroke={metric.color}
                    strokeWidth="1.5"
                    points={points}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </section>

      {/* Actions and Local Registry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Quick Actions Panel */}
        <section className="lg:col-span-4 bg-[#111827] border border-[#1f2937] p-5 rounded-xl flex flex-col space-y-4 shadow-sm select-none">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#f9fafb] font-mono pb-2 border-b border-[#1f2937]">Workstation Core Actions</h3>
          
          <div className="flex flex-col space-y-2.5">
            <button 
              onClick={() => router.push('/dashboard/chat')}
              className="w-full h-9 bg-[#0b0f19] hover:bg-[#1f2937] border border-[#1f2937] hover:border-[#3b82f6] text-[11.5px] font-semibold text-[#f9fafb] rounded-lg cursor-pointer flex items-center justify-between px-3.5 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <svg className="w-3.5 h-3.5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Launch Chat Terminal</span>
              </div>
              <span className="text-[9px] font-mono text-[#6b7280]">CMD+1</span>
            </button>

            <button 
              onClick={() => router.push('/dashboard/agents')}
              className="w-full h-9 bg-[#0b0f19] hover:bg-[#1f2937] border border-[#1f2937] hover:border-[#10b981] text-[11.5px] font-semibold text-[#f9fafb] rounded-lg cursor-pointer flex items-center justify-between px-3.5 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <svg className="w-3.5 h-3.5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span>Autonomous Agent Control</span>
              </div>
              <span className="text-[9px] font-mono text-[#6b7280]">CMD+2</span>
            </button>

            <button 
              onClick={() => router.push('/dashboard/workflows')}
              className="w-full h-9 bg-[#0b0f19] hover:bg-[#1f2937] border border-[#1f2937] hover:border-[#8b5cf6] text-[11.5px] font-semibold text-[#f9fafb] rounded-lg cursor-pointer flex items-center justify-between px-3.5 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <svg className="w-3.5 h-3.5 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Orchestrate Workflows</span>
              </div>
              <span className="text-[9px] font-mono text-[#6b7280]">CMD+4</span>
            </button>

            <button 
              onClick={() => router.push('/dashboard/terminal')}
              className="w-full h-9 bg-[#0b0f19] hover:bg-[#1f2937] border border-[#1f2937] hover:border-[#a855f7] text-[11.5px] font-semibold text-[#f9fafb] rounded-lg cursor-pointer flex items-center justify-between px-3.5 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <svg className="w-3.5 h-3.5 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Monospaced Shell</span>
              </div>
              <span className="text-[9px] font-mono text-[#6b7280]">CMD+8</span>
            </button>
          </div>

          <div className="pt-3 border-t border-[#1f2937]">
            <p className="text-[10px] text-[#6b7280] font-mono leading-relaxed">
              All tools run locally with absolute privacy bounds. Network access is not required for computation. Persistent indices are preserved under sandboxed SQLite.
            </p>
          </div>
        </section>

        {/* Local Weights Model Registry */}
        <section className="lg:col-span-8 bg-[#111827] border border-[#1f2937] p-5 rounded-xl flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#f9fafb] font-mono pb-2 border-b border-[#1f2937] select-none">Local Weight Registry</h3>
          
          <div className="flex-grow overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-[11.5px]">
              <thead>
                <tr className="border-b border-[#1f2937] text-[#6b7280] font-mono uppercase tracking-wider select-none">
                  <th className="py-2.5 font-bold">Model Spec</th>
                  <th className="py-2.5 font-bold">Context Size</th>
                  <th className="py-2.5 font-bold">VRAM Footprint</th>
                  <th className="py-2.5 font-bold">Inference Rate</th>
                  <th className="py-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {modelsRegistry.map((model, idx) => {
                  const isActive = model.status === 'active';
                  const isLoaded = model.status === 'loaded';

                  return (
                    <tr key={idx} className="border-b border-[#1f2937]/50 hover:bg-[#1f2937]/40 transition-colors">
                      <td className="py-3 font-semibold text-[#f9fafb] font-sans flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-[#9ca3af] bg-[#0b0f19] px-1.5 py-0.5 rounded border border-[#1f2937]">
                          {model.provider}
                        </span>
                        <span>{model.name}</span>
                      </td>
                      <td className="py-3 font-mono text-[#9ca3af]">{model.contextSize}</td>
                      <td className="py-3 font-mono text-[#9ca3af]">{model.vram}</td>
                      <td className="py-3 font-mono text-[#10b981] font-semibold">{model.speed}</td>
                      <td className="py-3 text-right select-none">
                        {isActive && (
                          <span className="px-2 py-0.5 rounded bg-[#3b82f6]/15 text-[#3b82f6] text-[10px] font-bold uppercase tracking-wider border border-[#3b82f6]/20">
                            Active
                          </span>
                        )}
                        {isLoaded && (
                          <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] text-[10px] font-bold uppercase tracking-wider border border-[#10b981]/20">
                            Loaded
                          </span>
                        )}
                        {model.status === 'available' && (
                          <span className="px-2 py-0.5 rounded bg-[#1f2937] text-[#6b7280] text-[10px] font-bold uppercase tracking-wider border border-[#1f2937]">
                            Standby
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>

    </div>
  );
}
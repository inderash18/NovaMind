"use client";

import React, { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'runtimes' | 'security'>('general');
  
  const [ollamaPort, setOllamaPort] = useState('11434');
  const [lmStudioPort, setLmStudioPort] = useState('1234');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving settings parameters...');
    setTimeout(() => {
      setSaveStatus('Settings successfully saved offline!');
      setTimeout(() => setSaveStatus(null), 2500);
    }, 1000);
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden select-text p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none">
        <h2 className="text-[15px] font-bold uppercase tracking-tight text-[#f9fafb]">System Configuration Options</h2>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">Manage local model hosting ports, FastAPIs connections, and secure workspace configurations.</p>
      </header>

      {/* Primary configuration card */}
      <section className="flex-grow flex flex-col min-h-0 bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
        
        {/* Tab switch header */}
        <div className="flex items-center px-5 h-11 border-b border-[#1f2937] bg-[#111827]/40 space-x-5 select-none shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-0.5 text-[11.5px] font-bold transition-all relative cursor-pointer uppercase tracking-wider ${
              activeTab === 'general' ? 'text-[#f9fafb]' : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            General Settings
            {activeTab === 'general' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6]"></span>}
          </button>
          
          <button
            onClick={() => setActiveTab('runtimes')}
            className={`py-3 px-0.5 text-[11.5px] font-bold transition-all relative cursor-pointer uppercase tracking-wider ${
              activeTab === 'runtimes' ? 'text-[#f9fafb]' : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            Model Runtimes
            {activeTab === 'runtimes' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6]"></span>}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-0.5 text-[11.5px] font-bold transition-all relative cursor-pointer uppercase tracking-wider ${
              activeTab === 'security' ? 'text-[#f9fafb]' : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            Security & Keys
            {activeTab === 'security' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6]"></span>}
          </button>
        </div>

        {/* Configurations form block */}
        <div className="flex-grow overflow-y-auto p-6 select-none max-w-xl">
          <form onSubmit={handleSave} className="space-y-5">
            
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">Platform Branding Label</label>
                  <input 
                    type="text" 
                    defaultValue="AetherOS sovereign developer console"
                    className="w-full bg-[#0b0f19] border border-[#1f2937] focus:border-[#3b82f6] rounded-lg px-3 py-1.5 text-xs text-[#f9fafb] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">Active Developer Handle</label>
                  <input 
                    type="text" 
                    defaultValue="indera_developer_x"
                    className="w-full bg-[#0b0f19] border border-[#1f2937] focus:border-[#3b82f6] rounded-lg px-3 py-1.5 text-xs text-[#f9fafb] outline-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'runtimes' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">Ollama Local API Port</label>
                  <input 
                    type="text" 
                    value={ollamaPort}
                    onChange={(e) => setOllamaPort(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1f2937] focus:border-[#3b82f6] rounded-lg px-3 py-1.5 text-xs text-[#f9fafb] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">LM Studio HTTP API Port</label>
                  <input 
                    type="text" 
                    value={lmStudioPort}
                    onChange={(e) => setLmStudioPort(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1f2937] focus:border-[#3b82f6] rounded-lg px-3 py-1.5 text-xs text-[#f9fafb] outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">Enforce sandbox controls</label>
                  <div className="flex items-center space-x-3.5">
                    <input 
                      type="checkbox" 
                      defaultChecked
                      className="w-3.5 h-3.5 rounded bg-[#0b0f19] border border-[#1f2937] accent-[#3b82f6]"
                    />
                    <span className="text-xs text-[#9ca3af]">Verify tool execution sandboxes boundaries before writing file buffers.</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">Telemetry options</label>
                  <div className="flex items-center space-x-3.5 opacity-55">
                    <input 
                      type="checkbox" 
                      disabled
                      className="w-3.5 h-3.5 rounded bg-[#0b0f19] border border-[#1f2937]"
                    />
                    <span className="text-xs text-[#6b7280]">All telemetry strictly disabled in sovereign local settings bounds.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Save trigger row */}
            <div className="pt-4 border-t border-[#1f2937]/60 flex items-center justify-between">
              <span className="text-[10.5px] font-mono text-[#10b981] font-semibold">{saveStatus}</span>
              <button 
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white text-[11px] font-bold tracking-wide transition-all active:scale-95 cursor-pointer shadow shadow-[#3b82f6]/10 shrink-0"
              >
                Save Changes
              </button>
            </div>

          </form>
        </div>

      </section>

    </div>
  );
}

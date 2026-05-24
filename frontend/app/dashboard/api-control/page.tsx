"use client";

import React, { useState } from 'react';

interface ApiKey {
  name: string;
  key: string;
  scope: string;
  created: string;
}

export default function ApiControlPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { name: 'default-frontend-token', key: 'ae_live_8394208a9c8f0e1d2', scope: 'Read/Write', created: '2026-05-24' },
    { name: 'secure-agent-sandbox', key: 'ae_live_3948293849c0d1e2f', scope: 'AstReadOnly', created: '2026-05-24' }
  ]);

  const handleCopy = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateKey = () => {
    const newKey: ApiKey = {
      name: `custom-dev-token-${apiKeys.length + 1}`,
      key: `ae_live_${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      scope: 'FullControl',
      created: new Date().toISOString().split('T')[0]
    };
    setApiKeys([...apiKeys, newKey]);
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden select-text p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none">
        <h2 className="text-[15px] font-bold uppercase tracking-tight text-[#f9fafb]">Developer API Control</h2>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">Configure sovereign API token credentials, curl endpoint parameters, and sandbox requests keys.</p>
      </header>

      {/* Primary column grids */}
      <div className="flex-grow overflow-y-auto space-y-6 pr-1">
        
        {/* Token Management block */}
        <section className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-sm select-none">
          <div className="px-5 py-4 border-b border-[#1f2937] bg-[#111827]/40 flex items-center justify-between">
            <div>
              <h3 className="text-[12.5px] font-bold text-[#f9fafb] uppercase tracking-wider">Active Token Credentials</h3>
              <p className="text-[10px] text-[#6b7280] mt-0.5">Developer authorization keys to query local FastAPIs endpoints securely.</p>
            </div>
            <button 
              onClick={handleGenerateKey}
              className="px-3 h-8.5 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white text-[10.5px] font-bold tracking-wide transition-all active:scale-95 cursor-pointer"
            >
              + Generate Token
            </button>
          </div>

          <div className="overflow-x-auto select-none">
            <table className="w-full text-left border-collapse text-[11.5px]">
              <thead>
                <tr className="h-9 border-b border-[#1f2937] bg-[#111827]/20 text-[9px] font-bold text-[#6b7280] uppercase tracking-wider select-none">
                  <th className="pl-5 pr-4 font-bold">Key Label</th>
                  <th className="px-4 font-bold">API Key Value</th>
                  <th className="px-4 font-bold">Authorization Scope</th>
                  <th className="px-4 font-bold">Issued Epoch</th>
                  <th className="pr-5 pl-4 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]/50 text-xs select-text">
                {apiKeys.map((item) => (
                  <tr key={item.key} className="hover:bg-[#1f2937]/20 transition-colors h-11">
                    <td className="pl-5 pr-4 font-semibold text-[#f9fafb]">{item.name}</td>
                    <td className="px-4 font-mono text-[#9ca3af]">{item.key.substring(0, 10)}...</td>
                    <td className="px-4">
                      <span className="text-[9px] font-mono bg-[#0b0f19] text-[#6b7280] px-2 py-0.5 rounded border border-[#1f2937]">{item.scope}</span>
                    </td>
                    <td className="px-4 font-mono text-[#6b7280]">{item.created}</td>
                    <td className="pr-5 pl-4 text-right select-none">
                      <button 
                        onClick={() => handleCopy(item.key)}
                        className="text-[11px] font-bold text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors cursor-pointer"
                      >
                        {copiedKey === item.key ? 'Copied!' : 'Copy Key'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Endpoint Documentation Card */}
        <section className="bg-[#111827] border border-[#1f2937] p-5 rounded-xl shadow-sm space-y-4">
          <div className="select-none">
            <h3 className="text-[12.5px] font-bold text-[#f9fafb] uppercase tracking-wider">REST endpoint curl guide</h3>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">Quick syntax guides to interact with AetherOS FastAPIs from standard developer consoles.</p>
          </div>

          <div className="rounded-lg border border-[#1f2937] bg-[#0b0f19] font-mono text-[11px] shadow-sm select-all relative overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#111827] border-b border-[#1f2937] select-none">
              <span className="text-[9.5px] font-bold text-[#6b7280] uppercase tracking-wider font-sans">
                stream chat completion request
              </span>
              <button 
                onClick={() => handleCopy("curl -X POST http://localhost:8000/api/v1/chat/generate \\\n  -H 'Authorization: Bearer ae_live_default' \\\n  -d '{\"model\": \"qwen2.5-7b\", \"prompt\": \"hello\"}'")}
                className="text-[9.5px] text-[#3b82f6] hover:text-[#3b82f6]/80 font-bold uppercase tracking-wider font-sans cursor-pointer"
              >
                Copy curl
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto text-[#9ca3af] leading-[1.6]">
              <code>{`curl -X POST http://localhost:8000/api/v1/chat/generate \\
  -H 'Authorization: Bearer ae_live_default' \\
  -d '{"model": "qwen2.5-7b", "prompt": "hello"}'`}</code>
            </pre>
          </div>
        </section>

      </div>

    </div>
  );
}

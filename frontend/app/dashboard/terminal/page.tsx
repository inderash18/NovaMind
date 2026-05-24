"use client";

import React, { useState, useRef, useEffect } from 'react';

interface TerminalLine {
  type: 'command' | 'stdout' | 'stderr' | 'reasoning' | 'warning' | 'info';
  text: string;
}

export default function TerminalPage() {
  const [inputVal, setInputVal] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', text: 'AetherOS Sovereign Terminal Core Gateway v2.0.0' },
    { type: 'info', text: 'Active local container: secure-sandbox-worker-cpu' },
    { type: 'reasoning', text: 'analyzing workspace permissions and initializing sandbox directory bounds...' },
    { type: 'stdout', text: '✓ Mount complete. Host ./data/scratch bound securely inside container.' },
    { type: 'warning', text: 'Warning: Sandboxed operations have restricted network socket access.' },
    { type: 'command', text: 'python math_sorter.py' },
    { type: 'stdout', text: 'Sorted Array: [11, 12, 22, 25, 34, 64, 90] in 0.0452ms' },
  ]);

  const [traceLogs, setTraceLogs] = useState<string[]>([
    'WS [19:40:02] Connected from localhost:3000',
    'DB [19:40:05] Query memory nodes successfully loaded',
    'EXEC [19:40:06] Launched CodingAgent subprocess safe thread',
    'WS [19:40:12] Broadcast packet size: 412 bytes chunked',
    'SYS [19:40:15] Garbage collection running: cleared 2.4 MB VRAM',
  ]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const cmd = inputVal.trim();
    const newLines = [...lines, { type: 'command' as const, text: cmd }];

    // Simple simulated CLI response engine
    if (cmd === 'clear') {
      setLines([]);
      setInputVal('');
      return;
    } else if (cmd === 'help') {
      newLines.push({ type: 'info', text: 'Available commands: help, status, vram, clear, run <script.py>' });
    } else if (cmd === 'status') {
      newLines.push({ type: 'stdout', text: '✓ All background nodes are operational.\n  - Ollama: Port 11434 (Online)\n  - LM Studio: Port 1234 (Offline)' });
    } else if (cmd === 'vram') {
      newLines.push({ type: 'warning', text: 'GPU VRAM: 4.8 GB allocated across active qwen2.5-7b weights.' });
    } else {
      newLines.push({ type: 'stderr', text: `bash: command not found: ${cmd}` });
    }

    setLines(newLines);
    setInputVal('');
    // Append trace log
    setTraceLogs(prev => [...prev, `CLI [${new Date().toLocaleTimeString()}] Executed: ${cmd}`]);
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines.length]);

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none">
        <h2 className="text-[15px] font-bold uppercase tracking-tight text-[#f9fafb]">Developer Terminal CLI</h2>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">Dual-column monospaced console tracking container subprocesses and background WebSocket traces.</p>
      </header>

      {/* Terminal Viewports Split Box */}
      <div className="flex-grow flex flex-col lg:flex-row gap-5 min-h-0 select-none">
        
        {/* Left column: Command Terminal (Sandbox) */}
        <div className="flex-1 flex flex-col bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-sm relative">
          
          {/* Chrome title */}
          <div className="px-4 py-2 border-b border-[#1f2937] bg-[#111827]/40 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] opacity-80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] opacity-80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] opacity-80"></span>
              <span className="text-[10px] font-mono text-[#6b7280] pl-2 font-semibold">
                sandbox@worker-worker-cpu
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-[#6b7280]">Restricted access</span>
          </div>

          {/* Lines block */}
          <div className="flex-grow overflow-y-auto p-4 space-y-2.5 bg-[#0b0f19] custom-scrollbar text-[11px] font-mono leading-relaxed select-text">
            {lines.map((line, idx) => (
              <div key={idx} className="break-all whitespace-pre-wrap">
                {line.type === 'command' && (
                  <span className="text-[#3b82f6] font-bold">
                    <span className="text-[#6b7280] select-none mr-2">$</span>
                    {line.text}
                  </span>
                )}
                {line.type === 'stdout' && (
                  <span className="text-[#10b981]">{line.text}</span>
                )}
                {line.type === 'stderr' && (
                  <span className="text-[#ef4444] font-semibold">{line.text}</span>
                )}
                {line.type === 'reasoning' && (
                  <span className="text-[#8b5cf6] italic opacity-85">{line.text}</span>
                )}
                {line.type === 'warning' && (
                  <span className="text-[#f59e0b]">{line.text}</span>
                )}
                {line.type === 'info' && (
                  <span className="text-[#6b7280]">{line.text}</span>
                )}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Prompt line input */}
          <div className="p-3 border-t border-[#1f2937] bg-[#111827] shrink-0">
            <form onSubmit={handleCommandSubmit} className="flex items-center space-x-2">
              <span className="text-[#6b7280] font-bold font-mono select-none">$</span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type help, status, vram, clear..."
                className="flex-1 bg-transparent border-0 text-[#f9fafb] outline-none placeholder-[#374151] font-mono text-xs caret-[#3b82f6]"
                autoFocus
              />
            </form>
          </div>

        </div>

        {/* Right column: System websocket log tracer */}
        <div className="flex-1 flex flex-col bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-sm relative">
          
          <div className="px-4 py-2 border-b border-[#1f2937] bg-[#111827]/40 flex items-center justify-between select-none">
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.06em] select-none">
              Background System Trace Logger
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-[#0b0f19] custom-scrollbar text-[11px] font-mono text-[#6b7280] leading-relaxed select-text">
            {traceLogs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap">
                {log.startsWith('stderr') ? (
                  <span className="text-[#ef4444]">{log}</span>
                ) : log.includes(' successfully ') ? (
                  <span className="text-[#10b981]">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}

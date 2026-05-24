"use client";

import React, { useState } from 'react';

interface StorageFile {
  name: string;
  type: 'code' | 'report' | 'log' | 'config';
  size: string;
  modified: string;
  sandboxBound: boolean;
}

export default function FilesPage() {
  const [files, setFiles] = useState<StorageFile[]>([
    { name: 'math_sorter.py', type: 'code', size: '312 B', modified: '2026-05-24 19:40:06', sandboxBound: true },
    { name: 'llm_efficiency_report.pdf', type: 'report', size: '2.4 MB', modified: '2026-05-24 14:55:07', sandboxBound: false },
    { name: 'secure_sandbox_setup.sh', type: 'config', size: '1.2 KB', modified: '2026-05-24 09:24:42', sandboxBound: true },
    { name: 'coding_agent_stdout.log', type: 'log', size: '8.4 KB', modified: '2026-05-24 19:40:15', sandboxBound: true },
    { name: 'aetheros_settings.env', type: 'config', size: '412 B', modified: '2026-05-24 09:25:15', sandboxBound: false }
  ]);

  const handleDeleteFile = (name: string) => {
    setFiles(files.filter(f => f.name !== name));
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden select-text p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none">
        <h2 className="text-[15px] font-bold uppercase tracking-tight text-[#f9fafb]">Sovereign Files Explorer</h2>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">Manage local workspace scratch documents, agent-generated coding assets, and reports.</p>
      </header>

      {/* Grid container */}
      <section className="flex-grow flex flex-col min-h-0 bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
        
        {/* Actions header */}
        <div className="p-4 border-b border-[#1f2937] bg-[#111827]/40 flex items-center justify-between select-none">
          <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.06em] select-none">
            Directory: ./data/scratch/
          </span>
          <button 
            type="button"
            className="px-3 h-7.5 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white text-[10.5px] font-bold tracking-wide flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            + Upload Document
          </button>
        </div>

        {/* List viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11.5px]">
            <thead>
              <tr className="h-9 border-b border-[#1f2937] bg-[#111827]/20 text-[9px] font-bold text-[#6b7280] uppercase tracking-wider select-none">
                <th className="pl-5 pr-4 font-bold">Document Asset Identifier</th>
                <th className="px-4 font-bold">Type</th>
                <th className="px-4 font-bold">File Size</th>
                <th className="px-4 font-bold">Modified Epoch</th>
                <th className="px-4 font-bold">Sandbox Limit</th>
                <th className="pr-5 pl-4 text-right font-bold">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]/50 text-xs">
              {files.map((file) => (
                <tr key={file.name} className="hover:bg-[#1f2937]/20 transition-colors h-12">
                  <td className="pl-5 pr-4 text-[#f9fafb] font-mono leading-relaxed select-all">{file.name}</td>
                  <td className="px-4">
                    <span className={`text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-bold ${
                      file.type === 'code' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' :
                      file.type === 'report' ? 'bg-[#10b981]/10 text-[#10b981]' :
                      file.type === 'log' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]' : 'bg-[#6b7280]/10 text-[#6b7280]'
                    }`}>
                      {file.type}
                    </span>
                  </td>
                  <td className="px-4 font-mono text-[#6b7280]">{file.size}</td>
                  <td className="px-4 font-mono text-[#6b7280]">{file.modified}</td>
                  <td className="px-4 select-none">
                    {file.sandboxBound ? (
                      <span className="text-[9.5px] font-bold uppercase tracking-wide bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.5 rounded border border-[#10b981]/20">Isolated</span>
                    ) : (
                      <span className="text-[9.5px] font-bold uppercase tracking-wide bg-[#111827] text-[#6b7280] px-1.5 py-0.5 rounded border border-[#1f2937]">Global</span>
                    )}
                  </td>
                  <td className="pr-5 pl-4 text-right select-none space-x-3.5">
                    <a 
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-[11px] font-bold text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors cursor-pointer"
                    >
                      Download
                    </a>
                    <button 
                      onClick={() => handleDeleteFile(file.name)}
                      className="text-[11px] font-bold text-[#6b7280] hover:text-[#ef4444] transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
}

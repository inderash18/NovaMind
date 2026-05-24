"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '../../components/layout/Sidebar';
import { useChatStore } from '../../store/chat.store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { availableModels, activeModel, setActiveModel } = useChatStore();
  const [searchVal, setSearchVal] = useState('');

  const getBreadcrumb = () => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard';
      case '/dashboard/chat': return 'AI Chat';
      case '/dashboard/agents': return 'Agents';
      case '/dashboard/models': return 'Models';
      case '/dashboard/workflows': return 'Workflows';
      case '/dashboard/memory': return 'Memory';
      case '/dashboard/files': return 'Files';
      case '/dashboard/api-control': return 'API Control';
      case '/dashboard/terminal': return 'Terminal';
      case '/dashboard/analytics': return 'Analytics';
      case '/dashboard/settings': return 'Settings';
      default: return 'AetherOS';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    // Route to chat search or simple command
    router.push(`/dashboard/chat?q=${encodeURIComponent(searchVal)}`);
    setSearchVal('');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0b0f19] text-[#f9fafb] font-sans select-none relative">
      
      {/* ========================================================
          STICKY TOP NAVBAR (48px EXACTLY, FLAT SOLID #111827 HEADER)
          ======================================================== */}
      <header className="h-12 border-b border-[#1f2937] bg-[#111827] flex items-center justify-between px-4 shrink-0 z-30 select-none relative">
        
        {/* Left Section: Branding & Navigation Title */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2 font-bold tracking-wider text-[#f9fafb]">
            <span className="w-6 h-6 rounded bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[11px] text-white">Æ</span>
            <span className="text-[13px] font-bold uppercase tracking-widest font-sans">AetherOS</span>
          </Link>
          
          <span className="text-[#374151] select-none font-mono">/</span>
          
          <span className="text-[#9ca3af] font-semibold text-[11.5px] tracking-wide uppercase font-sans">
            {getBreadcrumb()}
          </span>
        </div>

        {/* Center Section: Minimal Search Bar (Vercel-style) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-72 select-text">
          <svg className="w-3.5 h-3.5 text-[#6b7280] absolute left-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search console command... (⌘K)" 
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-[#0b0f19] border border-[#1f2937] hover:border-[#374151] focus:border-[#3b82f6] rounded-lg pl-9 pr-8 py-1 text-[11.5px] text-[#f9fafb] placeholder-[#6b7280] outline-none transition-all"
          />
          <span className="absolute right-2.5 px-1.5 py-0.5 bg-[#111827] border border-[#1f2937] rounded text-[8px] font-mono text-[#6b7280] pointer-events-none uppercase">⌘K</span>
        </form>

        {/* Right Section: System Status + Profile actions */}
        <div className="flex items-center space-x-4">
          
          {/* Active Model Selector */}
          <div className="flex items-center space-x-1.5 bg-[#0b0f19] border border-[#1f2937] px-2.5 py-0.5 rounded-lg select-none">
            <svg className="w-3 h-3 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <select 
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="bg-transparent text-[10px] font-mono text-[#9ca3af] hover:text-[#f9fafb] focus:outline-none cursor-pointer pr-1"
            >
              {availableModels.length > 0 ? (
                availableModels.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#0b0f19]">{m.name}</option>
                ))
              ) : (
                <option value="qwen2.5-7b">qwen2.5-7b</option>
              )}
            </select>
          </div>

          {/* Health Status indicator */}
          <div className="flex items-center space-x-1.5 bg-[#0b0f19] border border-[#1f2937] px-2.5 py-0.5 rounded-lg text-[10px] text-[#9ca3af] font-sans font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
            <span className="hidden sm:inline">Active Operational</span>
          </div>

          {/* User profile dropdown trigger */}
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="w-5.5 h-5.5 rounded-full bg-[#1f2937] hover:bg-[#374151] border border-[#1f2937] flex items-center justify-center text-[10px] font-bold text-[#9ca3af] hover:text-[#f9fafb] cursor-pointer"
            title="User Settings"
          >
            U
          </button>
        </div>
      </header>

      {/* Under Top Bar Workspace container */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative z-10">
        <Sidebar />
        <main className="flex-grow min-w-0 h-full overflow-hidden relative flex flex-col bg-[#0b0f19]">
          {children}
        </main>
      </div>

    </div>
  );
}

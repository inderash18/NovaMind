"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MarketingLandingPage() {
  const router = useRouter();
  
  // Interactive Prompt Box States
  const [promptText, setPromptText] = useState('');
  const placeholders = [
    "Deploy a local llama3 model inside a secure container...",
    "Set up an autonomous coding agent to refactor our API layer...",
    "Create a memory index for document vector semantic searches...",
    "Analyze system VRAM limits and optimize local weight speeds..."
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(60);

  // Live Preview Tabs States
  const [activePreviewTab, setActivePreviewTab] = useState<'chat' | 'agents' | 'monitor' | 'registry' | 'terminal'>('chat');

  // Typing effect loop for prompt input
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fullText = placeholders[placeholderIndex];
    
    if (!isDeleting) {
      timer = setTimeout(() => {
        setCurrentPlaceholder(fullText.substring(0, currentPlaceholder.length + 1));
        if (currentPlaceholder === fullText) {
          // Pause at the end
          timer = setTimeout(() => setIsDeleting(true), 2500);
        }
      }, typingSpeed);
    } else {
      timer = setTimeout(() => {
        setCurrentPlaceholder(fullText.substring(0, currentPlaceholder.length - 1));
        if (currentPlaceholder === '') {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }
      }, typingSpeed / 2);
    }

    return () => clearTimeout(timer);
  }, [currentPlaceholder, isDeleting, placeholderIndex]);

  const handlePromptSuggestionClick = (suggestion: string) => {
    setPromptText(suggestion);
  };

  return (
    <div className="min-h-screen w-screen bg-[#0b0f19] text-[#f9fafb] font-sans selection:bg-[#3b82f6]/30 relative overflow-x-hidden">
      
      {/* Background elegant abstract glows (Very subtle, no cyber cyber effect) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#3b82f6]/5 to-transparent blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-[#8b5cf6]/2 blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[#6366f1]/2 blur-[140px] pointer-events-none z-0"></div>

      {/* ========================================================
          1. STICKY BLURRED NAVBAR (56px)
          ======================================================== */}
      <nav className="fixed top-0 inset-x-0 h-14 bg-[#0b0f19]/70 backdrop-blur-md border-b border-white/[0.04] z-50 flex items-center justify-between px-6 md:px-12 select-none">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[12px] font-bold text-white shadow-md shadow-[#3b82f6]/10 group-hover:scale-[1.03] transition-transform">Æ</span>
            <span className="text-[14px] font-bold uppercase tracking-widest text-[#f9fafb]">AetherOS</span>
          </Link>

          {/* Nav quick links */}
          <div className="hidden lg:flex items-center space-x-6 text-[12px] font-medium text-[#9ca3af]">
            <a href="#features" className="hover:text-[#f9fafb] transition-colors">Features</a>
            <a href="#preview" className="hover:text-[#f9fafb] transition-colors">Console Preview</a>
            <a href="#stats" className="hover:text-[#f9fafb] transition-colors">Local Architecture</a>
            <span className="w-[1px] h-3.5 bg-white/[0.08]"></span>
            <a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Models</a>
            <a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Agents</a>
            <a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Pricing</a>
          </div>
        </div>

        {/* Right Side: GitHub, Login & Launch Action */}
        <div className="flex items-center space-x-3.5 select-none">
          <a 
            href="#" 
            onClick={(e) => e.preventDefault()}
            className="hidden sm:flex items-center text-[#9ca3af] hover:text-[#f9fafb] transition-colors"
            title="GitHub Repository"
          >
            <svg className="w-[16px] h-[16px]" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
            </svg>
          </a>

          <button 
            onClick={() => router.push('/login')} 
            className="text-[12px] font-semibold text-[#9ca3af] hover:text-[#f9fafb] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Sign in
          </button>
          
          <button 
            onClick={() => router.push('/dashboard')} 
            className="h-8.5 px-4 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/95 text-white text-[11.5px] font-bold tracking-wide flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-[#3b82f6]/10 active:scale-95 transition-all"
          >
            <span>Launch Dashboard</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ========================================================
          2. CENTERED HERO SECTION
          ======================================================== */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 select-none">
        
        {/* Version announcement badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full text-[10.5px] font-semibold tracking-wide text-[#9ca3af] hover:border-white/[0.1] hover:text-[#f9fafb] cursor-pointer transition-all select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
          <span>AetherOS v1.2 is officially live</span>
          <span className="text-white/[0.2] font-mono">|</span>
          <span className="text-[#3b82f6] flex items-center gap-0.5">
            Read changelog 
            <svg className="w-2.5 h-2.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>

        {/* Large clean headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#f9fafb] mt-6 max-w-3xl leading-[1.12]">
          A local-first AI operating system <br />
          <span className="bg-gradient-to-r from-[#9ca3af] via-[#f9fafb] to-[#6b7280] bg-clip-text text-transparent">
            for real-world automation.
          </span>
        </h1>

        {/* Hero subtitle */}
        <p className="text-[13.5px] sm:text-[15px] text-[#9ca3af] mt-4.5 max-w-2xl leading-relaxed select-text">
          Run models, agents, workflows, semantic memory matrices, and automated sandbox tools from one extremely fast, private developer workspace.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-row items-center gap-3 mt-8">
          <button 
            onClick={() => router.push('/dashboard')}
            className="h-10 px-5.5 rounded-xl bg-[#f9fafb] hover:bg-[#e5e7eb] text-[#0b0f19] text-[12.5px] font-bold tracking-wide cursor-pointer transition-colors active:scale-98"
          >
            Launch Workstation
          </button>
          
          <a 
            href="#features"
            className="h-10 px-5.5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15] text-[#9ca3af] hover:text-[#f9fafb] text-[12.5px] font-semibold tracking-wide flex items-center justify-center transition-all"
          >
            Explore Features
          </a>
        </div>

        {/* ========================================================
            3. INTERACTIVE LOVABLE-STYLE PROMPT INPUT
            ======================================================== */}
        <div className="w-full max-w-2xl bg-[#111827]/80 border border-white/[0.06] rounded-2xl p-4 mt-16 shadow-xl relative z-10 flex flex-col space-y-3">
          
          {/* Mock textarea box */}
          <div className="flex items-start space-x-3 text-left">
            <span className="w-5 h-5 rounded bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[9px] text-white font-mono font-bold select-none shrink-0 mt-0.5">Æ</span>
            <div className="flex-1 min-w-0">
              <textarea 
                rows={1}
                placeholder={currentPlaceholder}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full bg-transparent text-[13px] text-[#f9fafb] placeholder-[#6b7280]/90 resize-none outline-none border-none leading-relaxed custom-scrollbar py-0.5"
              />
            </div>
          </div>

          {/* Action buttons strip */}
          <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-[11px] text-[#6b7280]">
            {/* Attachment features */}
            <div className="flex items-center space-x-3.5">
              <button className="hover:text-[#f9fafb] transition-colors flex items-center gap-1 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>Attach code</span>
              </button>
              
              <button className="hover:text-[#f9fafb] transition-colors flex items-center gap-1 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>Voice input</span>
              </button>
            </div>

            {/* Run pill button */}
            <button 
              onClick={() => {
                if (promptText.trim()) {
                  router.push(`/dashboard/chat?q=${encodeURIComponent(promptText)}`);
                } else {
                  router.push('/dashboard/chat');
                }
              }}
              className="h-7 px-3.5 bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white rounded-lg flex items-center space-x-1 cursor-pointer transition-colors font-semibold"
            >
              <span>Execute</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button 
              onClick={() => handlePromptSuggestionClick("Spin up an autonomous coding agent weights")}
              className="px-2 py-0.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] text-[9.5px] text-[#9ca3af] hover:text-[#f9fafb] rounded transition-all cursor-pointer"
            >
              "Spin up coding agent"
            </button>
            <button 
              onClick={() => handlePromptSuggestionClick("Index documentation in local vector database")}
              className="px-2 py-0.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] text-[9.5px] text-[#9ca3af] hover:text-[#f9fafb] rounded transition-all cursor-pointer"
            >
              "Load vector index"
            </button>
            <button 
              onClick={() => handlePromptSuggestionClick("Split terminal logs pipeline metrics")}
              className="px-2 py-0.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] text-[9.5px] text-[#9ca3af] hover:text-[#f9fafb] rounded transition-all cursor-pointer"
            >
              "Observe cluster logs"
            </button>
          </div>
        </div>

      </section>

      {/* ========================================================
          4. INTERACTIVE LIVE PREVIEW SECTION (BROWSER MOCKUP)
          ======================================================== */}
      <section id="preview" className="py-20 px-6 max-w-5xl mx-auto select-none">
        <div className="text-center space-y-3 mb-10">
          <span className="text-[10px] font-bold text-[#3b82f6] tracking-[0.15em] uppercase">Interactive Workspace</span>
          <h2 className="text-2xl font-bold tracking-tight text-[#f9fafb]">No video required. Test the runtime screens.</h2>
          <p className="text-[12px] text-[#9ca3af] max-w-lg mx-auto">Explore high-density mock versions of the five main panels inside the AetherOS developer console.</p>
        </div>

        {/* Browser container mockup */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[480px]">
          
          {/* Browser header bar */}
          <div className="bg-[#0b0f19] border-b border-white/[0.04] h-10 px-4 flex items-center justify-between">
            {/* Red, Yellow, Green mock circles */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]/40"></span>
            </div>

            {/* Simulated Address bar */}
            <div className="bg-[#111827] px-8 py-0.5 rounded-md border border-white/[0.03] text-[9.5px] text-[#6b7280] font-mono select-none tracking-wide text-center max-w-xs truncate flex-1 mx-8">
              console.aetheros.local/{activePreviewTab}
            </div>

            {/* Mock action button */}
            <button 
              onClick={() => router.push(`/dashboard/${activePreviewTab === 'monitor' ? '' : activePreviewTab}`)}
              className="text-[9.5px] text-[#3b82f6] hover:text-[#3b82f6]/80 font-bold uppercase tracking-wider cursor-pointer"
            >
              Open Console ↗
            </button>
          </div>

          {/* Interactive controls strip */}
          <div className="bg-[#111827] border-b border-white/[0.04] flex items-center px-4 space-x-2 shrink-0 py-2.5 overflow-x-auto scrollbar-thin">
            {[
              { id: 'chat', label: 'AI Console Chat' },
              { id: 'agents', label: 'Autonomous Agents' },
              { id: 'monitor', label: 'System Resource Monitor' },
              { id: 'registry', label: 'Model Weight Registry' },
              { id: 'terminal', label: 'Split Terminal CLI' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActivePreviewTab(tab.id as any)}
                className={`px-3 py-1 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activePreviewTab === tab.id 
                    ? 'bg-[#1f2937] border border-white/[0.06] text-[#3b82f6]' 
                    : 'text-[#9ca3af] hover:text-[#f9fafb] hover:bg-white/[0.02]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mockup Active Content frame */}
          <div className="flex-1 bg-[#0b0f19] min-h-0 relative p-4.5 overflow-y-auto">
            
            {/* 1. CHAT TAB PREVIEW */}
            {activePreviewTab === 'chat' && (
              <div className="h-full flex flex-col justify-between space-y-4">
                <div className="space-y-4 max-w-3xl mx-auto w-full">
                  {/* User query */}
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[#1f2937] text-[#9ca3af] text-[9px] flex items-center justify-center font-bold">U</div>
                    <div className="flex-1 text-[12px] bg-[#111827] border border-white/[0.04] p-3 rounded-xl max-w-[85%] text-[#f9fafb] font-medium leading-relaxed">
                      Optimize a SQLite migration schema file for AetherOS agent memories. Include indexes.
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[9px] text-white font-mono font-bold shrink-0 mt-0.5">Æ</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#9ca3af] leading-relaxed">
                        Here is the high-performance local memory schema:
                      </p>
                      
                      <div className="mt-2.5 bg-[#111827] border border-white/[0.04] rounded-lg p-3 font-mono text-[10.5px] text-[#f9fafb] overflow-x-auto">
                        <span className="text-[#3b82f6]">CREATE TABLE</span> memories (<br />
                        &nbsp;&nbsp;id TEXT PRIMARY KEY,<br />
                        &nbsp;&nbsp;embedding BLOB,<br />
                        &nbsp;&nbsp;document TEXT,<br />
                        &nbsp;&nbsp;created_at INTEGER<br />
                        );<br />
                        <span className="text-[#3b82f6]">CREATE INDEX</span> idx_memories_created_at <span className="text-[#3b82f6]">ON</span> memories(created_at);
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. AGENTS TAB PREVIEW */}
            {activePreviewTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 h-full">
                {[
                  { name: 'CodingAgent', task: 'Writing API migration scripts', status: 'Active Executing', color: '#10b981', tools: 'FS, Python, Shell' },
                  { name: 'ResearchAgent', task: 'Synthesizing web search profiles', status: 'Evaluating data', color: '#3b82f6', tools: 'WebSearch, PDFParser' },
                  { name: 'WorkflowAgent', task: 'Monitoring backup pipelines', status: 'Standby idle', color: '#6b7280', tools: 'Cron, SQLite, FS' }
                ].map((agent, i) => (
                  <div key={i} className="bg-[#111827] border border-white/[0.04] p-3.5 rounded-xl flex flex-col justify-between h-36">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#f9fafb]">{agent.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-white/[0.03] text-[#9ca3af] border border-white/[0.04]">v1.0</span>
                      </div>
                      <p className="text-[10px] text-[#6b7280] mt-1.5 font-mono truncate">Task: {agent.task}</p>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-[#6b7280]">Status</span>
                        <span className="font-semibold flex items-center gap-1" style={{ color: agent.color }}>
                          <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: agent.color }}></span>
                          {agent.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9.5px] border-t border-white/[0.04] pt-1.5">
                        <span className="text-[#6b7280]">Capability</span>
                        <span className="font-mono text-[#9ca3af] text-[9px]">{agent.tools}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. MONITOR TAB PREVIEW */}
            {activePreviewTab === 'monitor' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 h-full">
                {[
                  { title: 'CPU Core Cluster', value: '18.4% load', sparkline: [12, 14, 18, 15, 22, 19, 17, 24, 18], color: '#3b82f6' },
                  { title: 'System RAM Pool', value: '7.2 GB / 32 GB', sparkline: [7.0, 7.1, 7.2, 7.2, 7.1, 7.2, 7.2, 7.3, 7.2], color: '#10b981' },
                  { title: 'GPU Core cluster', value: '32.0% load', sparkline: [25, 30, 42, 28, 48, 35, 30, 52, 32], color: '#8b5cf6' },
                  { title: 'System VRAM pool', value: '4.8 GB / 16 GB', sparkline: [4.8, 4.8, 4.8, 4.8, 4.8, 4.8, 4.8, 4.8, 4.8], color: '#a855f7' }
                ].map((metric, i) => {
                  const min = Math.min(...metric.sparkline);
                  const max = Math.max(...metric.sparkline);
                  const range = max - min || 1;
                  const points = metric.sparkline
                    .map((val, k) => `${(k * 15).toFixed(1)},${(30 - ((val - min) / range) * 20).toFixed(1)}`)
                    .join(' ');

                  return (
                    <div key={i} className="bg-[#111827] border border-white/[0.04] p-3 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden group">
                      <div>
                        <span className="text-[9.5px] font-bold text-[#6b7280] uppercase tracking-wider block">{metric.title}</span>
                        <span className="text-[13px] font-bold text-[#f9fafb] tracking-tight mt-1.5 block">{metric.value}</span>
                      </div>
                      
                      {/* Interactive mock mini sparkline */}
                      <div className="absolute bottom-0 inset-x-0 h-10 select-none pointer-events-none opacity-40">
                        <svg className="w-full h-full" viewBox="0 0 120 30" preserveAspectRatio="none">
                          <polyline points={points} fill="none" stroke={metric.color} strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. REGISTRY TAB PREVIEW */}
            {activePreviewTab === 'registry' && (
              <div className="bg-[#111827] border border-white/[0.04] rounded-xl overflow-hidden h-full">
                <table className="w-full text-left border-collapse text-[10.5px]">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-[#0b0f19] text-[#6b7280] text-[8.5px] uppercase font-semibold h-7 select-none">
                      <th className="pl-4 pr-3">Model Weight ID</th>
                      <th className="px-3">Provider</th>
                      <th className="px-3">VRAM Pool</th>
                      <th className="px-3">Speed (tok/s)</th>
                      <th className="pr-4 text-right">Status State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {[
                      { name: 'qwen2.5-7b-instruct', provider: 'Ollama (Local)', vram: '4.8 GB', speed: '48.2 tok/s', status: 'Active' },
                      { name: 'llama3-8b-instruct', provider: 'Ollama (Local)', vram: '5.6 GB', speed: '42.5 tok/s', status: 'Loaded' },
                      { name: 'deepseek-r1-7b-instruct', provider: 'LM Studio', vram: '5.2 GB', speed: '38.6 tok/s', status: 'Standby' }
                    ].map((model, idx) => (
                      <tr key={idx} className="h-8.5 text-[#9ca3af]">
                        <td className="pl-4 pr-3 font-mono font-medium text-[#f9fafb]">{model.name}</td>
                        <td className="px-3">{model.provider}</td>
                        <td className="px-3 font-mono text-[9.5px]">{model.vram}</td>
                        <td className="px-3 font-mono text-[9.5px] text-[#10b981] font-semibold">{model.speed}</td>
                        <td className="pr-4 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide ${
                            model.status === 'Active' ? 'bg-[#10b981]/10 text-[#10b981]' : 
                            model.status === 'Loaded' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : 
                            'bg-white/[0.02] text-[#6b7280]'
                          }`}>
                            {model.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. TERMINAL TAB PREVIEW */}
            {activePreviewTab === 'terminal' && (
              <div className="bg-[#111827]/90 border border-white/[0.04] rounded-lg p-3 h-full font-mono text-[11px] leading-relaxed text-[#f9fafb]">
                <div className="flex items-center space-x-1.5 mb-2 border-b border-white/[0.03] pb-1.5 text-[9.5px] text-[#6b7280]">
                  <span>bash</span>
                  <span>•</span>
                  <span>aetheros-sandbox-stdout</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6b7280]">$ aetheros initialize --local-sandbox</p>
                  <p className="text-[#10b981]">[system] verified ollama active on port 11434 (latency: 12ms)</p>
                  <p className="text-[#8b5cf6]">[memory] persistent vector state loaded - 4,821 hashes active</p>
                  <p className="text-[#3b82f6]">[gateway] developer workstation portal active on port 3000</p>
                  <p className="text-[#f9fafb] animate-pulse font-bold">$ _</p>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================
          5. FEATURES SECTION
          ======================================================== */}
      <section id="features" className="py-20 px-6 bg-[#111827]/40 border-y border-white/[0.04] relative select-none">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center space-y-3 mb-16">
            <span className="text-[10px] font-bold text-[#3b82f6] tracking-[0.15em] uppercase">Core Capabilities</span>
            <h2 className="text-2xl font-bold tracking-tight text-[#f9fafb]">Sovereign intelligence, optimized locally.</h2>
            <p className="text-[12px] text-[#9ca3af] max-w-lg mx-auto">All modules run entirely inside your container workspace. Secure, developer-focused, 100% private.</p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Local LLM Execution",
                desc: "Direct integration with Ollama and LM Studio. Load and hot-swap active weights instantly.",
                icon: (
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )
              },
              {
                title: "AI Agent Sandbox",
                desc: "Run background automation nodes with file system tools, code compilers, and terminal pipes.",
                icon: (
                  <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 11.172V5L8 4z" />
                  </svg>
                )
              },
              {
                title: "Memory Engine",
                desc: "Automatic embedding extraction, storage, and recall of code files, chat logs, and logs in SQLite.",
                icon: (
                  <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H3.75A1.5 1.5 0 002.25 3.75v16.5A1.5 1.5 0 003.75 21.75h16.5a1.5 1.5 0 001.5-1.5V17.25a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                )
              },
              {
                title: "Workflow Automation",
                desc: "Design chronological visual tasks pipelines, event hooks, and system backup triggers.",
                icon: (
                  <svg className="w-5 h-5 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                  </svg>
                )
              },
              {
                title: "Vector Database",
                desc: "Built-in, zero-config vector matching indices mapped on lightweight file formats for fast queries.",
                icon: (
                  <svg className="w-5 h-5 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                  </svg>
                )
              },
              {
                title: "Multi-Model Gateway",
                desc: "Intelligently bridge queries across cloud-based nodes (Anthropic, OpenAI) and local weights.",
                icon: (
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                title: "Voice Assistant Pipe",
                desc: "Integrated WebAudio pipes translating ambient vocal commands to direct sandbox actions.",
                icon: (
                  <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )
              },
              {
                title: "Monospaced Terminal",
                desc: "Visual split shell capturing live stdout logs feeds alongside local secure scripts executing.",
                icon: (
                  <svg className="w-5 h-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              }
            ].map((feat, index) => (
              <div 
                key={index}
                className="bg-[#111827]/80 border border-white/[0.05] p-5 rounded-xl hover:border-white/[0.1] hover:bg-[#111827] transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
                  {feat.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[12.5px] font-bold text-[#f9fafb] uppercase tracking-wider">{feat.title}</h3>
                  <p className="text-[11px] text-[#9ca3af] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          6. TRUST & STATS SECTION
          ======================================================== */}
      <section id="stats" className="py-20 px-6 max-w-5xl mx-auto select-none">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
          {/* Left info */}
          <div className="space-y-4 lg:col-span-1">
            <span className="text-[10px] font-bold text-[#3b82f6] tracking-[0.15em] uppercase">Local Statistics</span>
            <h2 className="text-2xl font-bold tracking-tight text-[#f9fafb]">Architected for raw benchmark speeds.</h2>
            <p className="text-[12px] text-[#9ca3af] leading-relaxed select-text">
              By removing cloud roundtrips and executing queries directly over internal system sockets (or custom secure sandbox bridges), AetherOS achieves sub-millisecond latencies.
            </p>
          </div>

          {/* Right stats grid */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {[
              { value: "8+ Models", label: "Supported local formats", desc: "Run llama3, qwen, deepseek, phi and customized weights." },
              { value: "45.2 tok/s", label: "Mean inference speed", desc: "Benchmarked locally on modest consumer GPU cards." },
              { value: "0ms Network", label: "Absolute offline sandbox", desc: "Zero outbound network calls required for runtime gates." },
              { value: "100% Secure", label: "SQLite state control", desc: "Your files, logs, and memory embeddings stay in your workspace." }
            ].map((stat, i) => (
              <div key={i} className="bg-[#111827]/50 border border-white/[0.04] p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <span className="text-xl sm:text-2xl font-bold text-[#f9fafb] tracking-tight">{stat.value}</span>
                <div className="space-y-1">
                  <span className="text-[11.5px] font-semibold text-[#3b82f6] block">{stat.label}</span>
                  <span className="text-[10.5px] text-[#6b7280] leading-relaxed block">{stat.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ========================================================
          7. MINIMAL GLASS TESTIMONIALS SECTION
          ======================================================== */}
      <section className="py-20 px-6 bg-[#111827]/20 border-t border-white/[0.04] select-none">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center space-y-3 mb-14">
            <span className="text-[10px] font-bold text-[#8b5cf6] tracking-[0.15em] uppercase">Developer Reviews</span>
            <h2 className="text-2xl font-bold tracking-tight text-[#f9fafb]">Approved by AI systems builders.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                quote: "AetherOS completely replaces messy docker stacks and shell terminals. Hotswapping local LLM weights and checking agent memory logs on a single unified console is extremely fast.",
                user: "Sarah Chen",
                role: "Senior AI Engineer, Matrix Labs"
              },
              {
                quote: "The visual workflow pipeline combined with monospaced split logs stdout captures is gorgeous. Having absolute 100% offline data guarantees keeps our security auditors happy.",
                user: "Devon Miller",
                role: "Lead Platform Architect, CloudGate"
              },
              {
                quote: "No cinematic glowing graphics, no fake science-fiction overlays. Just a dense, extremely fast, highly productive command workstation. This is the UI developers actually want.",
                user: "Elena Rostova",
                role: "Cognitive UX Specialist, Aethera"
              }
            ].map((t, idx) => (
              <div 
                key={idx} 
                className="bg-[#111827] border border-white/[0.05] p-5 rounded-xl flex flex-col justify-between space-y-6 hover:border-white/[0.09] transition-colors"
              >
                <p className="text-[11px] sm:text-[11.5px] text-[#9ca3af] leading-relaxed italic select-text">
                  "{t.quote}"
                </p>
                <div className="flex items-center space-x-3 border-t border-white/[0.04] pt-3.5">
                  <div className="w-6.5 h-6.5 rounded-full bg-[#1f2937] flex items-center justify-center text-[10px] font-bold text-[#f9fafb]">
                    {t.user.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-[#f9fafb]">{t.user}</h4>
                    <span className="text-[9.5px] text-[#6b7280]">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          8. MINIMAL ENTERPRISE FOOTER
          ======================================================== */}
      <footer className="border-t border-white/[0.04] bg-[#0b0f19] py-12 px-6 select-none relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-8 text-[11px] text-[#6b7280]">
          
          {/* Logo brand info */}
          <div className="space-y-3.5 max-w-xs">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white font-mono">Æ</span>
              <span className="text-[11.5px] font-bold uppercase tracking-widest text-[#f9fafb]">AetherOS</span>
            </div>
            <p className="leading-relaxed">
              Sovereign local AI operating workstation. Run private agents, index files, load models offline.
            </p>
            <p className="text-[10px]">
              &copy; {new Date().getFullYear()} AetherOS Inc. All node systems reserved.
            </p>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-14">
            
            {/* Column 1 */}
            <div className="space-y-3">
              <h4 className="font-bold text-[#f9fafb] uppercase tracking-wider text-[9.5px]">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Launch Workstation</a></li>
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Model Registry</a></li>
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Agent Sandbox</a></li>
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Visual Workflows</a></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <h4 className="font-bold text-[#f9fafb] uppercase tracking-wider text-[9.5px]">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>API Gateway Specs</a></li>
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Documentation Docs</a></li>
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Ollama Configurations</a></li>
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>GitHub Repos</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="font-bold text-[#f9fafb] uppercase tracking-wider text-[9.5px]">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Privacy Guidelines</a></li>
                <li><a href="#" className="hover:text-[#f9fafb] transition-colors" onClick={(e) => e.preventDefault()}>Security Audits</a></li>
              </ul>
            </div>

          </div>

        </div>
      </footer>

    </div>
  );
}

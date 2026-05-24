import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chat.store';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { providers, createSession, selectSession } = useChatStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const ollama = providers['ollama'] || { status: 'offline', latency_ms: 0 };
  const lmstudio = providers['lmstudio'] || { status: 'offline', latency_ms: 0 };

  const navLinks = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      name: 'AI Chat', 
      path: '/dashboard/chat', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    { 
      name: 'Agents', 
      path: '/dashboard/agents', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 00-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 11.172V5L8 4z" />
        </svg>
      )
    },
    { 
      name: 'Models', 
      path: '/dashboard/models', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      name: 'Workflows', 
      path: '/dashboard/workflows', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      )
    },
    { 
      name: 'Memory', 
      path: '/dashboard/memory', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H3.75A1.5 1.5 0 002.25 3.75v16.5A1.5 1.5 0 003.75 21.75h16.5a1.5 1.5 0 001.5-1.5V17.25a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
      )
    },
    { 
      name: 'Files', 
      path: '/dashboard/files', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 004.5 15h15a2.25 2.25 0 002.25-2.25m-19.5 0v.25A2.25 2.25 0 004.5 17.5h15a2.25 2.25 0 002.25-2.25v-.25m-19.5 0V9M2.25 9V6A2.25 2.25 0 014.5 3.75h1.5m.25 0h11.5a2.25 2.25 0 012.25 2.25v3M6 3.75v3.375c0 .621.504 1.125 1.125 1.125h9.75" />
        </svg>
      )
    },
    { 
      name: 'API Control', 
      path: '/dashboard/api-control', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      )
    },
    { 
      name: 'Terminal', 
      path: '/dashboard/terminal', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: 'Analytics', 
      path: '/dashboard/analytics', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    },
    { 
      name: 'Settings', 
      path: '/dashboard/settings', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  const isOllamaOnline = ollama.status === 'healthy';
  const isLMStudioOnline = lmstudio.status === 'healthy';

  return (
    <div 
      className={`h-full flex flex-col justify-between shrink-0 transition-all duration-150 border-r border-[#1f2937] bg-[#0d0e12] relative z-20 ${
        isCollapsed ? 'w-[52px] px-1.5' : 'w-[200px] px-3'
      } py-4`}
    >
      <div className="relative z-10 flex-1 flex flex-col min-h-0 select-none">
        
        {/* Brand/Toggle Section */}
        <div className="flex items-center justify-between mb-4 px-2 select-none">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.08em] select-none">
              Console Menu
            </span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[#9ca3af] hover:text-[#f9fafb] transition-colors p-1 rounded hover:bg-[#1f2937] cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Global Navigation links */}
        <nav className="space-y-0.5 overflow-y-auto flex-1 custom-scrollbar pr-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path}
                href={link.path}
                className={`flex items-center gap-3 px-3 h-8.5 rounded transition-all duration-150 ${
                  isActive 
                    ? 'bg-[#1f2937] text-[#f9fafb] font-medium border-l-2 border-[#3b82f6]' 
                    : 'text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#111827]'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-[#3b82f6]' : 'text-[#6b7280]'}`}>{link.icon}</span>
                {!isCollapsed && <span className="text-[12px] tracking-wide truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status logs */}
      <div className="pt-3 border-t border-[#1f2937] flex flex-col gap-2 relative z-10 select-none">
        {!isCollapsed ? (
          <div className="space-y-1.5 px-2 select-none">
            <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-[0.08em] block">
              Node Runtimes
            </span>
            
            <div className="space-y-1 font-mono text-[9.5px]">
              {/* Ollama Health */}
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">Ollama</span>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOllamaOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></span>
                  <span className={isOllamaOnline ? 'text-[#10b981] font-medium' : 'text-[#ef4444]'}>
                    {isOllamaOnline ? 'active' : 'offline'}
                  </span>
                </div>
              </div>

              {/* LM Studio Health */}
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">LM Studio</span>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLMStudioOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></span>
                  <span className={isLMStudioOnline ? 'text-[#10b981] font-medium' : 'text-[#ef4444]'}>
                    {isLMStudioOnline ? 'active' : 'offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 select-none">
            <span className={`w-2 h-2 rounded-full ${isOllamaOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} title="Ollama"></span>
            <span className={`w-2 h-2 rounded-full ${isLMStudioOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} title="LM Studio"></span>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { useChatStore, Session } from '../../../store/chat.store';
import ChatWindow from '../../../components/chat/ChatWindow';
import MemoryPanel from '../../../components/memory/MemoryPanel';
import ExecutionTimeline from '../../../components/agents/ExecutionTimeline';
import TerminalLogs from '../../../components/agents/TerminalLogs';

export default function ChatPage() {
  const { loadAllSessions, selectSession, activeSessionId, sessions, deleteSession, createSession, activeModel } = useChatStore();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'memory'>('pipeline');

  useEffect(() => {
    loadAllSessions().then(() => {
      const currentSessions = useChatStore.getState().sessions;
      const keys = Object.keys(currentSessions);
      if (keys.length > 0 && !activeSessionId) {
        const sortedKeys = keys.sort((a, b) => currentSessions[b].created_at - currentSessions[a].created_at);
        selectSession(sortedKeys[0]);
      }
    });
  }, [loadAllSessions, selectSession, activeSessionId]);

  const sessionList = Object.values(sessions).sort((a, b) => b.created_at - a.created_at);

  const handleNewSession = async () => {
    const newId = await createSession();
    selectSession(newId);
  };

  return (
    <div className="flex-1 flex flex-row min-w-0 h-full overflow-hidden bg-[#0f1117] text-[#f0f6fc]">
      {/* 220px nav sidebar is already mounted globally in layout.tsx! */}

      {/* ========================================================
          1. SESSION LIST SIDEBAR (200px EXACTLY, #0d1117 BACKGROUND)
          ======================================================== */}
      <div className="w-[200px] shrink-0 bg-[#0d1117] border-r border-white/[0.06] flex flex-col justify-between py-3 z-10 select-none">
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between px-3.5 mb-3.5">
            <span className="text-[10px] font-bold text-[#484f58] uppercase tracking-[0.08em]">
              Sessions
            </span>
            <button 
              onClick={handleNewSession}
              className="text-[#8b949e] hover:text-[#388bfd] transition-colors p-0.5 rounded hover:bg-[#161b22] cursor-pointer"
              title="New session"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Session history links */}
          <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)] px-2 scrollbar-thin">
            {sessionList.length === 0 ? (
              <div className="text-[10px] text-[#484f58] italic text-center py-6 border border-dashed border-white/[0.04] rounded">
                No sessions
              </div>
            ) : (
              sessionList.map((session) => {
                const isActive = activeSessionId === session.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`group relative flex items-center justify-between px-3 h-10 rounded cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#1c2128] text-[#f0f6fc]'
                        : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#f0f6fc]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-5 select-none">
                      <span className="text-[12px] font-medium truncate leading-none">
                        {session.title}
                      </span>
                      <span className="text-[9px] text-[#484f58] font-mono tracking-wider uppercase mt-1">
                        {session.model.substring(0, 10)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 absolute right-2 hover:bg-[#f85149]/10 p-0.5 rounded transition-all duration-150 text-[#484f58] hover:text-[#f85149]"
                      title="Destroy session"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CHAT THREAD (FLEXIBLE)
          ======================================================== */}
      <div className="flex-1 min-w-0 h-full flex flex-col relative z-10 border-r border-white/[0.06]">
        <ChatWindow />
      </div>

      {/* ========================================================
          3. CONTEXT PANEL (280px EXACTLY)
          ======================================================== */}
      <div className="w-[280px] shrink-0 bg-[#0d1117] flex flex-col h-full z-10 select-none">
        
        {/* Tab switcher header */}
        <div className="flex items-center px-4 h-10 border-b border-white/[0.06] bg-[#0d1117] space-x-4">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-2 px-0.5 text-[12px] font-medium transition-all relative cursor-pointer ${
              activeTab === 'pipeline'
                ? 'text-[#f0f6fc] font-semibold'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Pipeline
            {activeTab === 'pipeline' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#388bfd]"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('memory')}
            className={`py-2 px-0.5 text-[12px] font-medium transition-all relative cursor-pointer ${
              activeTab === 'memory'
                ? 'text-[#f0f6fc] font-semibold'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Memory
            {activeTab === 'memory' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#388bfd]"></span>
            )}
          </button>
        </div>

        {/* Tab Panels */}
        <div className="flex-1 min-h-0 bg-[#0f1117]/35 relative">
          {activeTab === 'pipeline' ? (
            <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
              {/* Stacked workflow feed activities */}
              <div className="flex-[4] min-h-0">
                <ExecutionTimeline />
              </div>
              {/* Dev stdout observer console */}
              <div className="flex-[3] min-h-0 border-t border-white/[0.04] pt-4">
                <TerminalLogs />
              </div>
            </div>
          ) : (
            <div className="h-full overflow-hidden">
              <MemoryPanel />
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

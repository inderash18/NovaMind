import React, { useRef, useEffect, useState } from 'react';
import { useChatStore } from '../../store/chat.store';
import { useAgentStore } from '../../store/agent.store';

export default function ChatWindow() {
  const { 
    sessions, 
    activeSessionId, 
    isStreaming, 
    inputMessage, 
    setInputMessage, 
    sendMessage,
    availableModels,
    activeModel,
    setActiveModel,
    fetchSystemStatus
  } = useChatStore();

  const { pendingPermission, resolvePermission } = useAgentStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = activeSessionId ? sessions[activeSessionId] : null;
  const [showThinkingMap, setShowThinkingMap] = useState<Record<string, boolean>>({});
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages?.length, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;
    sendMessage(inputMessage);
  };

  const toggleThinking = (msgId: string) => {
    setShowThinkingMap(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const codeText = lang ? lines.slice(1).join('\n') : lines.join('\n');
        
        return (
          <div key={index} className="my-3.5 rounded-lg overflow-hidden border border-[#1f2937] bg-[#0b0f19] font-mono text-[12px] shadow-sm select-all relative">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#111827] border-b border-[#1f2937]">
              <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-sans select-none">
                {lang || 'source code'}
              </span>
              <button 
                onClick={() => handleCopyCode(codeText)}
                className="text-[10px] text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors uppercase tracking-wider font-sans font-semibold cursor-pointer select-none"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[#f9fafb] leading-[1.7] max-w-full whitespace-pre">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      
      return (
        <p key={index} className="text-[#f9fafb] text-[13px] leading-[1.75] whitespace-pre-wrap mb-3.5 last:mb-0 select-text">
          {part}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] relative min-w-0 font-sans overflow-hidden">
      
      {/* Top Header bar with clean info display */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-[#1f2937] bg-[#111827]/40 backdrop-blur-sm relative z-10 select-none">
        <div>
          <h1 className="text-[12.5px] font-bold text-[#f9fafb] uppercase tracking-wider">
            {activeSession ? activeSession.title : 'AI Conversation Session'}
          </h1>
          <p className="text-[9.5px] text-[#6b7280] mt-0.5 uppercase tracking-widest font-mono font-semibold">
            {activeSession ? `${activeSession.model}` : 'STANDBY IDLE'}
          </p>
        </div>

        {/* Token and model status parameters */}
        <div className="flex items-center space-x-3.5 pr-2 font-mono text-[10px] text-[#6b7280]">
          <span className="select-none hidden sm:inline">Context: 1,842 / 32,768 tokens</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
        </div>
      </header>

      {/* Main chat window scroll list container */}
      <div className="flex-grow overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar pb-36 relative z-10">
        {activeSession && activeSession.messages.length > 0 ? (
          activeSession.messages.map((message) => (
            <div 
              key={message.id}
              className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} group`}
            >
              {/* Message frame - clean surface separation */}
              <div className={`max-w-[80%] rounded-xl p-4 transition-all duration-150 ${
                message.role === 'user' 
                  ? 'bg-[#161e2e]/95 border border-[#1f2937] text-[#f9fafb]'
                  : 'text-[#f9fafb] bg-transparent pl-0 pr-6 border-0'
              }`}>
                {/* Reasoning Accordion (DeepSeek CoT Process) */}
                {message.role === 'assistant' && message.reasoning && (
                  <div className="mb-4 rounded-lg border-l-2 border-[#8b5cf6] bg-[#111827]/60 overflow-hidden border border-[#1f2937]">
                    <button 
                      onClick={() => toggleThinking(message.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-[10.5px] font-mono text-[#9ca3af] hover:text-[#f9fafb] transition-colors font-semibold select-none cursor-pointer"
                    >
                      <span className="flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full bg-[#8b5cf6] ${isStreaming ? 'animate-pulse' : ''}`}></span>
                        <span>Reasoning Logic Process</span>
                      </span>
                      <span className={`transform transition-transform duration-200 ${showThinkingMap[message.id] ? 'rotate-90' : ''}`}>➔</span>
                    </button>
                    {showThinkingMap[message.id] && (
                      <div className="p-3.5 text-[11px] font-mono text-[#9ca3af] italic border-t border-[#1f2937] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar select-all bg-[#0b0f19]/30">
                        {message.reasoning}
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Message text content */}
                <div className="markdown-body">
                  {renderMessageContent(message.content)}
                </div>
              </div>

              {/* Timestamp label - visible on hover */}
              <span className="text-[9.5px] text-[#6b7280] font-mono mt-1.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none my-12">
            <div className="w-12 h-12 rounded-xl bg-[#111827] border border-[#1f2937] flex items-center justify-center text-[#6b7280] mb-4">
              <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-[13px] font-bold text-[#f9fafb] mb-1 tracking-wider uppercase">Enterprise Chat Console</h2>
            <p className="text-[12px] text-[#9ca3af] max-w-sm leading-relaxed">
              Query the active model and execute local commands securely. Context memories and agentic timelines are connected automatically.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ========================================================
          ENTERPRISE FLAT INPUT VIEWPORT & CONTROLS
          ======================================================== */}
      <div className="absolute bottom-6 inset-x-0 flex flex-col items-center z-20 px-8">
        
        {/* Center floating glassmorphic rounded rectangular input capsule container */}
        <form 
          onSubmit={handleSubmit} 
          className="relative z-10 w-full max-w-2xl bg-[#111827] border border-[#1f2937] rounded-xl p-3 flex flex-col space-y-3 shadow-lg hover:border-[#374151] transition-all duration-200"
        >
          {/* Row 1: Prompt Text Input */}
          <div className="relative z-10 w-full">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              disabled={isStreaming}
              placeholder={isStreaming ? "Streaming tokens generator..." : "Ask anything..."}
              className="w-full bg-transparent border-0 px-2 py-1.5 text-xs text-[#f9fafb] placeholder-[#6b7280] outline-none caret-[#3b82f6]"
            />
          </div>
          
          {/* Row 2: Actions Bar */}
          <div className="relative z-10 flex items-center justify-between select-none border-t border-[#1f2937]/60 pt-2.5">
            
            {/* Left Actions Group */}
            <div className="flex items-center space-x-2">
              {/* Plus attachment button */}
              <button 
                type="button" 
                className="w-6.5 h-6.5 rounded-lg flex items-center justify-center bg-[#0b0f19] border border-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1f2937] transition-all duration-150 cursor-pointer select-none"
                title="Add attachment"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Pill Selector: Normal */}
              <button 
                type="button" 
                className="px-2.5 h-6.5 rounded-lg flex items-center space-x-1.5 bg-[#0b0f19] border border-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1f2937] transition-all duration-150 cursor-pointer select-none"
              >
                <svg className="w-3 h-3 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-semibold text-[10px]">Normal</span>
                <svg className="w-2 h-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Pill Selector: DeepThink */}
              <button 
                type="button" 
                className="px-2.5 h-6.5 rounded-lg flex items-center space-x-1.5 bg-[#0b0f19] border border-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1f2937] transition-all duration-150 cursor-pointer select-none"
              >
                <svg className="w-3 h-3 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-semibold text-[10px]">DeepThink</span>
                <svg className="w-2 h-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Right Actions Group */}
            <div className="flex items-center space-x-2">
              
              {/* Button: Voice */}
              <button 
                type="button" 
                className="px-2.5 h-6.5 rounded-lg flex items-center space-x-1.5 bg-[#0b0f19] border border-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1f2937] transition-all duration-150 cursor-pointer select-none"
              >
                <svg className="w-3 h-3 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-semibold text-[10px]">Voice</span>
              </button>

              {/* Circular Send Button */}
              <button 
                type="submit"
                disabled={isStreaming || !inputMessage.trim()}
                className="w-6.5 h-6.5 rounded-lg flex items-center justify-center bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 z-10"
              >
                <svg className="w-3 h-3 transform rotate-45 translate-x-[-0.5px] translate-y-[0.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* ========================================================
          macOS-STYLE SOVEREIGN PERMISSIONS CARD ALERT
          ======================================================== */}
      {pendingPermission && (
        <div className="absolute inset-0 bg-[#0b0f19]/75 flex items-center justify-center p-6 z-50 select-none">
          <div className="max-w-md w-full bg-[#111827] border border-[#1f2937] p-5 rounded-xl shadow-2xl relative select-none">
            
            <div className="flex items-start space-x-3.5 pb-4 border-b border-[#1f2937]">
              <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/25 flex items-center justify-center flex-shrink-0 text-[#ef4444]">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-bold text-[#f9fafb]">
                  Permission Required
                </h3>
                <p className="text-[10px] text-[#6b7280] font-mono uppercase tracking-widest mt-0.5 font-semibold">
                  Secure High-Privilege Action
                </p>
              </div>
            </div>

            {/* Details panel */}
            <div className="py-4 space-y-3.5 select-text">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-widest font-mono">
                  Operation Tool:
                </span>
                <div className="px-2.5 py-1.5 bg-[#0b0f19] border border-[#1f2937] rounded font-mono text-[11px] font-semibold text-[#f9fafb]">
                  {pendingPermission.tool}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-widest font-mono">
                  Command Arguments Diff:
                </span>
                <div className="bg-[#0b0f19] border border-[#1f2937] p-3 rounded-lg overflow-x-auto max-h-36 custom-scrollbar text-[10.5px] font-mono text-[#9ca3af]">
                  <pre>{JSON.stringify(pendingPermission.arguments, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Dialog controls */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#1f2937] select-none">
              <button 
                onClick={() => resolvePermission(pendingPermission.id, false)}
                className="px-3 py-1.5 rounded-lg bg-transparent border border-[#1f2937] hover:bg-[#111827] text-xs font-semibold text-[#9ca3af] hover:text-[#f9fafb] cursor-pointer"
              >
                Block
              </button>
              <button 
                onClick={() => resolvePermission(pendingPermission.id, true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-xs font-bold text-white cursor-pointer shadow-sm shadow-[#3b82f6]/10"
              >
                Approve
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
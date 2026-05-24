import React, { useState } from 'react';
import { useChatStore } from '../../store/chat.store';

export default function MemoryPanel() {
  const { searchResults, searchMemories, activeSessionId } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    searchMemories(val);
  };

  const handleManualIndexSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNote.trim() || !activeSessionId || isIndexing) return;

    setIsIndexing(true);
    setIndexStatus("indexing...");
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/memories/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          text: manualNote.trim(),
          workspace: 'default'
        })
      });

      if (res.ok) {
        setManualNote('');
        setIndexStatus("persisted");
        setTimeout(() => setIndexStatus(null), 3000);
      } else {
        setIndexStatus("failed");
      }
    } catch (err) {
      setIndexStatus("connection failed");
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between p-4 bg-[#161B22]/40 font-sans text-xs">
      
      {/* Search Input & List Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Header Bar */}
        <header className="mb-4 select-none">
          <div className="flex items-center space-x-1.5 text-[9px] font-bold tracking-widest text-[#9AA4B2] uppercase">
            <span>Cognitive Indexer</span>
          </div>
          <h3 className="text-xs font-semibold text-[#F5F7FA] mt-0.5 uppercase tracking-wider">
            Sovereign Vector Memory
          </h3>
        </header>

        {/* Real-time Search input */}
        <div className="mb-4 select-none">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search memories semantically..."
              className="w-full bg-[#161B22] border border-white/[0.06] focus:border-[#6366F1]/45 rounded-lg px-3 py-2 text-xs text-[#F5F7FA] placeholder-[#6B7280] outline-none transition-colors"
            />
            <span className="absolute right-3 text-[#6B7280] text-[10px]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Matches list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 scrollbar-thin">
          <h4 className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider px-1 select-none">
            {searchQuery ? 'Semantic Matches' : 'Episodic Store'}
          </h4>

          {searchResults.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-white/[0.04] rounded-lg select-none">
              <svg className="w-6 h-6 mx-auto mb-2 text-[#6B7280]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-[10px] text-[#6B7280] leading-relaxed italic">
                {searchQuery ? 'No relevant matches discovered.' : 'Query historical contexts above.'}
              </p>
            </div>
          ) : (
            searchResults.map((mem) => {
              const matchPercent = Math.round(mem.similarity_score * 100);
              const isSummary = mem.metadata?.type === 'chat_summary';
              
              return (
                <div 
                  key={mem.id}
                  className="p-3 border border-white/[0.04] bg-[#161B22]/30 rounded-lg hover:border-white/[0.08] transition-colors"
                >
                  <div className="flex justify-between items-center gap-2 mb-2 select-none">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-[#9AA4B2] bg-[#1D2430] px-1.5 py-0.5 rounded border border-white/[0.04] uppercase">
                      {isSummary ? 'Summary' : 'Message'}
                    </span>
                    <span className="text-[9px] font-bold font-mono text-[#6366F1] bg-[#6366F1]/10 px-1.5 py-0.5 rounded border border-[#6366F1]/20">
                      {matchPercent}% match
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-[#9AA4B2] leading-relaxed break-words select-text">
                    {mem.text}
                  </p>
                  
                  <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex justify-between text-[8px] text-[#6B7280] font-mono select-none">
                    <span>cached local node</span>
                    <span>{new Date(mem.metadata?.timestamp * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Pin Section */}
      <div className="pt-3 border-t border-white/[0.04] mt-3">
        <h4 className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider px-1 mb-2 select-none">
          Pin Spec Boundaries
        </h4>
        
        <form onSubmit={handleManualIndexSubmit} className="space-y-2">
          <textarea
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            placeholder="Anchor rules, workspace configurations, or architectural preferences to query semantically..."
            className="w-full h-20 bg-[#161B22] border border-white/[0.06] focus:border-[#6366F1]/45 rounded-lg p-3.5 text-[10px] text-[#F5F7FA] placeholder-[#6B7280] outline-none resize-none leading-relaxed transition-colors"
            disabled={!activeSessionId || isIndexing}
          />
          
          <div className="flex justify-between items-center px-1 select-none">
            <span className="text-[8px] font-mono text-[#9AA4B2] font-semibold uppercase">
              {indexStatus || 'Workspace Context'}
            </span>
            <button
              type="submit"
              disabled={!manualNote.trim() || !activeSessionId || isIndexing}
              className={`px-2.5 py-1.5 rounded font-bold text-[8px] uppercase tracking-wider border transition-colors cursor-pointer ${
                !manualNote.trim() || !activeSessionId || isIndexing
                  ? 'border-white/[0.04] text-[#6B7280] cursor-not-allowed bg-transparent'
                  : 'border-[#6366F1]/30 bg-[#6366F1]/10 text-white hover:bg-[#6366F1]/20 hover:border-[#6366F1]/45 shadow-sm'
              }`}
            >
              Pin vector
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

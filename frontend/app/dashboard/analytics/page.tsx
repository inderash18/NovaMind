"use client";

import React, { useState } from 'react';

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState<'7d' | '30d'>('7d');

  // Sparkline coordinates for token usage
  const tokenTrend7d = [42, 58, 48, 62, 74, 52, 68];
  const tokenTrend30d = [42, 38, 45, 52, 58, 48, 55, 62, 68, 74, 70, 72, 65, 68, 70, 72, 75, 78, 80, 82, 85, 90, 88, 85, 82, 88, 92, 95, 90, 98];

  const activeTrend = activeRange === '7d' ? tokenTrend7d : tokenTrend30d;

  // Custom SVG path coordinates generator for Area chart
  const minVal = Math.min(...activeTrend);
  const maxVal = Math.max(...activeTrend);
  const range = maxVal - minVal || 1;
  
  const width = 500;
  const height = 180;
  
  const points = activeTrend.map((val, idx) => {
    const x = (idx * (width / (activeTrend.length - 1))).toFixed(1);
    const y = (height - 20 - ((val - minVal) / range) * (height - 40)).toFixed(1);
    return `${x},${y}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  const areaData = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  // Models Latency bar chart data
  const latencies = [
    { name: 'qwen2.5-7b', latency: 48, color: '#3b82f6' },
    { name: 'llama3-8b', latency: 62, color: '#8b5cf6' },
    { name: 'mistral-7b', latency: 54, color: '#6366f1' },
    { name: 'gpt-4o-mini', latency: 120, color: '#10b981' },
    { name: 'claude-3-5', latency: 154, color: '#f59e0b' }
  ];

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0b0f19] text-[#f9fafb] overflow-hidden select-text p-6 font-sans">
      
      {/* Header */}
      <header className="mb-5 shrink-0 select-none flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold uppercase tracking-tight text-[#f9fafb]">Performance & Analytics</h2>
          <p className="text-[11px] text-[#9ca3af] mt-0.5">Track offline token volume generations, server request speeds, and models latencies.</p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center space-x-1 bg-[#111827] border border-[#1f2937] p-1 rounded-lg select-none">
          <button 
            onClick={() => setActiveRange('7d')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${
              activeRange === '7d' ? 'bg-[#1f2937] text-[#f9fafb]' : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            7 Days
          </button>
          <button 
            onClick={() => setActiveRange('30d')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${
              activeRange === '30d' ? 'bg-[#1f2937] text-[#f9fafb]' : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            30 Days
          </button>
        </div>
      </header>

      {/* Primary splitting charts grid */}
      <div className="flex-grow overflow-y-auto space-y-5 pr-1">
        
        {/* Top Mini cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
          
          <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl shadow-sm">
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.05em]">Daily token volume</span>
            <div className="text-[18px] font-bold text-[#f9fafb] mt-1.5 tracking-tight">418.4 K tokens</div>
            <span className="text-[9.5px] text-[#10b981] font-semibold mt-1 block">▲ 12.4% vs last week</span>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl shadow-sm">
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.05em]">Mean response speed</span>
            <div className="text-[18px] font-bold text-[#f9fafb] mt-1.5 tracking-tight">44.8 tok / sec</div>
            <span className="text-[9.5px] text-[#10b981] font-semibold mt-1 block">▲ 4.2% optimization index</span>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl shadow-sm">
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.05em]">Peak request capacity</span>
            <div className="text-[18px] font-bold text-[#f9fafb] mt-1.5 tracking-tight">18 req / min</div>
            <span className="text-[9.5px] text-[#6b7280] font-mono mt-1 block">Standard local limits threshold</span>
          </div>

        </section>

        {/* Charts area split row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Token Usage Area Chart (SVG) */}
          <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-xl shadow-sm flex flex-col h-[280px]">
            <div className="mb-4 select-none">
              <h3 className="text-[12.5px] font-bold text-[#f9fafb] uppercase tracking-wider">Token volume generations</h3>
              <p className="text-[9.5px] text-[#6b7280] mt-0.5">Aggregate token index throughput values over time.</p>
            </div>

            {/* SVG area graph container */}
            <div className="flex-1 w-full relative min-h-0 select-none">
              <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="40" x2={width} y2="40" stroke="#1f2937" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="90" x2={width} y2="90" stroke="#1f2937" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="140" x2={width} y2="140" stroke="#1f2937" strokeWidth="1" strokeDasharray="3,3" />
                
                {/* Area polygon fill */}
                <polygon points={areaData.replace(/M | L | Z/g, ' ').trim()} fill="url(#grad-area)" />
                {/* Area stroke line */}
                <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Model Latencies Bar Chart (SVG) */}
          <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-xl shadow-sm flex flex-col h-[280px]">
            <div className="mb-4 select-none">
              <h3 className="text-[12.5px] font-bold text-[#f9fafb] uppercase tracking-wider">Models latency profile</h3>
              <p className="text-[9.5px] text-[#6b7280] mt-0.5">Mean response time measurements in milliseconds (lower is better).</p>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="flex-1 flex flex-col justify-between select-none">
              {latencies.map((item) => {
                const maxLat = 200;
                const pct = Math.min((item.latency / maxLat) * 100, 100);

                return (
                  <div key={item.name} className="flex items-center text-[10.5px]">
                    <span className="w-24 font-mono font-bold text-[#9ca3af] truncate">{item.name}</span>
                    <div className="flex-1 h-3 bg-[#0b0f19] rounded overflow-hidden mx-3 relative">
                      <div 
                        style={{ width: `${pct}%`, backgroundColor: item.color }} 
                        className="h-full rounded transition-all duration-300"
                      ></div>
                    </div>
                    <span className="w-16 font-mono text-[#6b7280] text-right font-bold">{item.latency} ms</span>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

      </div>

    </div>
  );
}

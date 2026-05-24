"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setStatus('Verifying credentials parameters...');
    setTimeout(() => {
      setStatus('Success! Authorizing workspace session...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    }, 1000);
  };

  const handleSocialMockLogin = (provider: string) => {
    setStatus(`Connecting securely to ${provider} auth portal...`);
    setTimeout(() => {
      setStatus('Access granted! Initializing secure workspace...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-screen bg-[#0b0f19] text-[#f9fafb] font-sans flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Subtle brand backglow in center (Vercel-inspired) */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#3b82f6]/4 blur-[100px] pointer-events-none select-none z-0"></div>

      {/* Authentication card */}
      <div className="relative z-10 w-full max-w-[390px] bg-[#111827] border border-[#1f2937] p-7 rounded-2xl shadow-xl flex flex-col space-y-6">
        
        {/* Branding header */}
        <div className="text-center select-none">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[13px] font-bold text-white shadow-md shadow-[#3b82f6]/10 group-hover:scale-[1.03] transition-transform">Æ</span>
            <span className="text-[15px] font-bold uppercase tracking-widest text-[#f9fafb]">AetherOS</span>
          </Link>
          <h2 className="text-[16px] font-bold text-[#f9fafb] mt-4 tracking-tight">Access Command Center</h2>
          <p className="text-[11px] text-[#9ca3af] mt-1 font-mono">Æther Secure Developer Workstation</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#9ca3af] tracking-wider mb-1.5 font-mono select-none">Workplace Email</label>
            <input 
              type="email" 
              required
              placeholder="e.g. architect@dev.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0b0f19] border border-[#1f2937] hover:border-[#374151] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-xs text-[#f9fafb] placeholder-[#4b5563] outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 select-none">
              <label className="block text-[10px] uppercase font-semibold text-[#9ca3af] tracking-wider font-mono">Console Secret Key</label>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-[10px] font-mono text-[#3b82f6] hover:text-[#60a5fa] transition-colors">Forgot Passkey?</a>
            </div>
            <input 
              type="password" 
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0b0f19] border border-[#1f2937] hover:border-[#374151] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-xs text-[#f9fafb] placeholder-[#4b5563] outline-none transition-colors"
            />
          </div>

          {/* Remember me option */}
          <div className="flex items-center justify-between select-none py-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 bg-[#0b0f19] border border-[#1f2937] rounded focus:ring-0 outline-none text-[#3b82f6] cursor-pointer"
              />
              <span className="text-[11px] text-[#9ca3af] font-mono">Keep session warm</span>
            </label>
          </div>

          {/* Action submit button */}
          <button 
            type="submit"
            className="w-full h-9 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-xs font-semibold text-white rounded-lg shadow-md cursor-pointer transition-all duration-150 active:scale-[0.98]"
          >
            Launch Core Workstation
          </button>
        </form>

        {/* Display verification status */}
        {status && (
          <div className="bg-[#0b0f19] border border-[#1f2937] px-3.5 py-2.5 rounded-lg flex items-center space-x-2.5">
            <span className="relative flex h-2 w-2 select-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3b82f6]"></span>
            </span>
            <span className="text-[10px] font-mono text-[#9ca3af]">{status}</span>
          </div>
        )}

        {/* Third-party divider */}
        <div className="relative flex items-center justify-center select-none py-1">
          <div className="absolute inset-x-0 h-[1px] bg-[#1f2937]"></div>
          <span className="relative bg-[#111827] px-3 text-[9px] font-semibold text-[#4b5563] uppercase font-mono tracking-widest">Federated Access</span>
        </div>

        {/* Social auth grid */}
        <div className="grid grid-cols-2 gap-3.5 select-none">
          <button 
            onClick={() => handleSocialMockLogin('GitHub')}
            className="h-8 border border-[#1f2937] bg-[#111827] hover:bg-[#1f2937] hover:border-[#374151] text-xs font-semibold text-[#f9fafb] flex items-center justify-center space-x-2 rounded-lg cursor-pointer transition-colors"
          >
            {/* GitHub custom SVG icon */}
            <svg className="w-3.5 h-3.5 text-[#f9fafb]" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
            </svg>
            <span>GitHub</span>
          </button>

          <button 
            onClick={() => handleSocialMockLogin('Google')}
            className="h-8 border border-[#1f2937] bg-[#111827] hover:bg-[#1f2937] hover:border-[#374151] text-xs font-semibold text-[#f9fafb] flex items-center justify-center space-x-2 rounded-lg cursor-pointer transition-colors"
          >
            {/* Google custom SVG icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>
        </div>

      </div>

    </div>
  );
}

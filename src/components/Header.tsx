import React from 'react';
import { Eye, ShieldCheck, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1B2A4A] to-[#E8532B] flex items-center justify-center text-white shadow-md shadow-orange-500/10">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1B2A4A]">
                Answer<span className="text-[#E8532B]">Lens</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-orange-100 text-[#E8532B] px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Gemini Vision
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Check your marks before the examiner does.
            </p>
          </div>
        </div>

        {/* Hackathon Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[11px] font-bold text-slate-700">
              Deterministic Scoring Engine
            </span>
            <span className="text-[10px] text-slate-400">
              Zero Score Hallucinations
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#2FA566]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

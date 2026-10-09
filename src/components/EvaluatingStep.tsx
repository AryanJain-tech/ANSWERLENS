import React, { useEffect, useState } from 'react';
import { Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const EvaluatingStep: React.FC = () => {
  const messages = [
    'Submitting verified transcript to examiner...',
    'Evaluating qualitative depth for each rubric criterion...',
    'Verifying exact substring evidence quotes (Evidence Guard)...',
    'Executing deterministic server score formula: weight × multiplier...',
    'Generating senior bhaiya/didi Hinglish review and model answer...',
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto my-6 space-y-6">
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-60" />
        <div className="relative w-16 h-16 rounded-full bg-[#1B2A4A] text-[#F5A524] flex items-center justify-center shadow-lg">
          <Scale className="w-8 h-8 animate-bounce" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[#1B2A4A]">{messages[index]}</h3>
        <p className="text-xs sm:text-sm text-slate-500">
          Strict university grading standards in progress.
        </p>
      </div>

      {/* Core Principle Callout */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B2A4A]">
          <ShieldCheck className="w-4 h-4 text-[#2FA566]" />
          <span>Core Principle Enforcement</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Gemini evaluates purely qualitatively (<em>present</em>, <em>partial</em>, or <em>missing</em>). The final score numbers are calculated 100% deterministically by our server code with the Evidence Guard.
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#2FA566]" />
        <span>Step 4 of 5 · Almost ready</span>
      </div>
    </div>
  );
};

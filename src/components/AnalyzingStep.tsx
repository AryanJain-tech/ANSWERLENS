import React, { useEffect, useState } from 'react';
import { Eye, FileCheck, Cpu, ShieldCheck } from 'lucide-react';

interface AnalyzingStepProps {
  question: string;
  marks: number;
}

export const AnalyzingStep: React.FC<AnalyzingStepProps> = ({ marks }) => {
  const loadingSteps = [
    { title: 'Reading your handwriting with Gemini Vision...', icon: Eye },
    { title: `Building objective ${marks}-mark rubric (Question & Marks ONLY)...`, icon: FileCheck },
    { title: 'Transcribing verbatim (retaining all spelling & grammar mistakes)...', icon: Cpu },
    { title: 'Inspecting hand-drawn diagrams & architectural flowcharts...', icon: ShieldCheck },
  ];

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [loadingSteps.length]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-8">
      {/* Animated Pulse Graphic */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-60" />
        <div className="absolute inset-2 rounded-full bg-blue-100 animate-pulse" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#1B2A4A] to-[#E8532B] flex items-center justify-center shadow-lg text-white">
          <Cpu className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold text-[#1B2A4A]">
          {loadingSteps[activeStepIndex].title}
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Executing dual parallel Gemini requests for zero-bias academic evaluation.
        </p>
      </div>

      {/* Parallel Execution Architecture Visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Parallel Thread A: Rubric
          </div>
          <p className="text-xs text-blue-800/80">
            Synthesizing {marks} marks into atomic criteria. <strong>Never sees the answer sheet</strong>, guaranteeing zero confirmation bias.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-900 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#E8532B] animate-pulse" />
            Parallel Thread B: Vision
          </div>
          <p className="text-xs text-orange-800/80">
            Transcribing handwriting with <strong>verbatim fidelity</strong> without autocorrecting errors, plus diagram detection.
          </p>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 pt-2">
        {loadingSteps.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all duration-500 ${
              idx === activeStepIndex
                ? 'w-8 bg-[#E8532B]'
                : idx < activeStepIndex
                ? 'w-2 bg-emerald-500'
                : 'w-2 bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

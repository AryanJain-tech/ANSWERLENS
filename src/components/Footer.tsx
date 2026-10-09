import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200/80 py-6 mt-12 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">
            AnswerLens · HackDays 2.0 · Team ERROR 404
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Google Gemini API</span>
          <span>•</span>
          <span>Multimodal Vision & Structured Output</span>
          <span>•</span>
          <span>Deterministic Server Evaluation</span>
        </div>
      </div>
    </footer>
  );
};

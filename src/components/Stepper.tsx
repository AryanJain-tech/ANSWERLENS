import React from 'react';
import {
  FileQuestion,
  ScanSearch,
  UserCheck,
  Scale,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { StepNumber } from '../types/index.ts';

interface StepperProps {
  currentStep: StepNumber;
  onStepClick?: (step: StepNumber) => void;
  maxCompletedStep: StepNumber;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepClick,
  maxCompletedStep,
}) => {
  const steps = [
    { number: 1 as StepNumber, title: 'Question', icon: FileQuestion, sub: 'Prompt & photo' },
    { number: 2 as StepNumber, title: 'Analyze', icon: ScanSearch, sub: 'Dual Gemini AI' },
    { number: 3 as StepNumber, title: 'Verify', icon: UserCheck, sub: 'Human checkpoint', isCheckpoint: true },
    { number: 4 as StepNumber, title: 'Evaluate', icon: Scale, sub: 'Strict marking' },
    { number: 5 as StepNumber, title: 'Score', icon: Award, sub: 'Final report' },
  ];

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3 sm:p-4 mb-6">
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {steps.map((step) => {
          const isCurrent = currentStep === step.number;
          const isCompleted = step.number < currentStep || step.number <= maxCompletedStep;
          const isClickable = onStepClick && step.number <= maxCompletedStep && step.number !== currentStep;
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              onClick={() => isClickable && onStepClick(step.number)}
              className={`relative flex flex-col items-center text-center p-1.5 sm:p-2 rounded-xl transition-all ${
                isClickable ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
              } ${
                isCurrent
                  ? step.isCheckpoint
                    ? 'bg-amber-50/80 ring-2 ring-[#F5A524]'
                    : 'bg-orange-50/80 ring-2 ring-[#E8532B]'
                  : ''
              }`}
            >
              {/* Step Icon / Circle */}
              <div
                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? step.isCheckpoint
                      ? 'bg-[#F5A524] text-white shadow-md shadow-amber-500/20'
                      : 'bg-[#E8532B] text-white shadow-md shadow-orange-500/20'
                    : isCompleted
                    ? 'bg-emerald-100 text-[#2FA566]'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#2FA566]" />
                ) : (
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                
                {/* Step badge */}
                <span className="absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900/10 text-slate-700">
                  {step.number}
                </span>
              </div>

              {/* Title & subtitle */}
              <div className="mt-1.5 flex flex-col items-center">
                <span
                  className={`text-xs sm:text-sm font-semibold leading-tight flex items-center gap-1 ${
                    isCurrent
                      ? step.isCheckpoint
                        ? 'text-amber-800'
                        : 'text-[#E8532B]'
                      : isCompleted
                      ? 'text-[#1B2A4A]'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                  {step.isCheckpoint && (
                    <span className="hidden lg:inline text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      Checkpoint
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  {step.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

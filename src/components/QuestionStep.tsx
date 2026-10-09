import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Sparkles,
  X,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SAMPLE_PRESETS, SamplePreset } from '../data/samplePresets.ts';
import { processImageFile, ProcessedImage } from '../utils/imageProcessor.ts';

interface QuestionStepProps {
  question: string;
  setQuestion: (q: string) => void;
  marks: 2 | 5 | 10;
  setMarks: (m: 2 | 5 | 10) => void;
  processedImage: ProcessedImage | null;
  setProcessedImage: (img: ProcessedImage | null) => void;
  sampleTranscript: string;
  setSampleTranscript: (t: string) => void;
  onStartAnalysis: () => void;
  isReattempt?: boolean;
}

export const QuestionStep: React.FC<QuestionStepProps> = ({
  question,
  setQuestion,
  marks,
  setMarks,
  processedImage,
  setProcessedImage,
  sampleTranscript,
  setSampleTranscript,
  onStartAnalysis,
  isReattempt = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (file: File) => {
    setProcessingError(null);
    setIsProcessingFile(true);
    setActiveSampleId(null);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file (JPEG, PNG, HEIC, or WebP).');
      }
      const processed = await processImageFile(file);
      setProcessedImage(processed);
      setSampleTranscript(''); // clear demo text when user uploads real photo
    } catch (err: any) {
      setProcessingError(err.message || 'Failed to process image.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = (sample: SamplePreset) => {
    setQuestion(sample.question);
    setMarks(sample.marks);
    setSampleTranscript(sample.sampleTranscript);
    setActiveSampleId(sample.id);
    setProcessingError(null);

    // Create a mock image object from sample SVG for visual display
    setProcessedImage({
      base64: sample.mockImageUrl.split(',')[1] || '',
      dataUrl: sample.mockImageUrl,
      mimeType: 'image/svg+xml',
      sizeBytes: 15400,
      width: 600,
      height: 420,
    });
  };

  const canSubmit = question.trim().length > 5 && (processedImage !== null || sampleTranscript.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Reattempt notification banner */}
      {isReattempt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between text-blue-900">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-semibold">
              Re-attempting same question: rubric is locked for fair comparison.
            </span>
          </div>
          <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            {marks} Marks
          </span>
        </div>
      )}

      {/* Preset Samples Bar */}
      {!isReattempt && (
        <div className="bg-gradient-to-r from-orange-50/70 to-blue-50/70 border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-[#E8532B]" />
              <span>Demo Presets (Instant test without camera):</span>
            </div>
            <span className="text-xs text-slate-500">Includes student paper & answer</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PRESETS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all flex items-center gap-1.5 ${
                  activeSampleId === sample.id
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#E8532B]" />
                {sample.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7 space-y-6">
        {/* Question Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-[#1B2A4A]">
              1. Exam Question Text <span className="text-[#E8532B]">*</span>
            </label>
            {question && (
              <button
                type="button"
                onClick={() => setQuestion('')}
                className="text-xs text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isReattempt}
            placeholder="Type or paste the exam question here (e.g. Explain normalization in DBMS with an example. Mention 1NF, 2NF and 3NF.)"
            rows={3}
            className={`w-full rounded-xl border p-3.5 text-sm sm:text-base leading-relaxed text-[#1B2A4A] placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
              isReattempt
                ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
                : 'border-slate-300 focus:border-[#E8532B] focus:ring-[#E8532B]/20'
            }`}
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>Be specific to enable detailed rubric criteria.</span>
            <span>{question.length} characters</span>
          </div>
        </div>

        {/* Total Marks Selector */}
        <div>
          <label className="block text-sm font-bold text-[#1B2A4A] mb-2">
            2. Total Question Marks <span className="text-[#E8532B]">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { m: 2 as const, label: '2 Marks', desc: 'Concise (2 atomic criteria)' },
              { m: 5 as const, label: '5 Marks', desc: 'Standard (4-5 criteria)' },
              { m: 10 as const, label: '10 Marks', desc: 'Long Form (6-8 criteria)' },
            ].map(({ m, label, desc }) => {
              const isSelected = marks === m;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={isReattempt}
                  onClick={() => setMarks(m)}
                  className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#E8532B] bg-orange-50/50 ring-2 ring-[#E8532B]/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  } ${isReattempt ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-base sm:text-lg font-bold ${
                        isSelected ? 'text-[#E8532B]' : 'text-[#1B2A4A]'
                      }`}
                    >
                      {label}
                    </span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E8532B]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Handwritten Answer Upload */}
        <div>
          <label className="block text-sm font-bold text-[#1B2A4A] mb-2">
            3. Handwritten Answer Sheet <span className="text-[#E8532B]">*</span>
          </label>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          {/* Upload Area / Preview */}
          {!processedImage ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                isDragging
                  ? 'border-[#E8532B] bg-orange-50/40'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-[#E8532B] mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-base font-semibold text-[#1B2A4A]">
                Drag and drop your handwritten answer photo
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Auto-rotates EXIF, compresses under 8MB, and preserves handwriting detail for Gemini Vision.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#1B2A4A] text-slate-800 text-sm font-semibold shadow-sm transition flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  Select Image File
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-[#E8532B] hover:bg-[#d64722] text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo (Mobile)
                </button>
              </div>

              {isProcessingFile && (
                <div className="mt-4 text-xs text-[#E8532B] font-medium animate-pulse">
                  Optimizing and preparing image for vision model...
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-48 h-36 bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner">
                <img
                  src={processedImage.dataUrl}
                  alt="Student handwritten answer preview"
                  className="w-full h-full object-contain"
                />
                {activeSampleId && (
                  <span className="absolute bottom-1 right-1 text-[10px] bg-slate-900/80 text-white font-mono px-1.5 py-0.5 rounded">
                    Demo Preset
                  </span>
                )}
              </div>

              <div className="flex-1 w-full space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1B2A4A] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#2FA566]" />
                    Handwritten Sheet Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProcessedImage(null);
                      setSampleTranscript('');
                      setActiveSampleId(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5 font-mono">
                  <div>Dimensions: {processedImage.width} x {processedImage.height} px</div>
                  <div>Payload Size: {(processedImage.sizeBytes / 1024).toFixed(1)} KB (Max 8 MB)</div>
                  <div>Format: JPEG / Auto EXIF Corrected</div>
                </div>
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    Replace Image
                  </button>
                </div>
              </div>
            </div>
          )}

          {processingError && (
            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{processingError}</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!canSubmit || isProcessingFile}
            onClick={onStartAnalysis}
            className={`w-full py-4 rounded-xl text-base font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
              canSubmit && !isProcessingFile
                ? 'bg-[#E8532B] hover:bg-[#d64722] text-white shadow-orange-500/25 hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Run Dual Parallel Analysis (Rubric + Vision)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            The rubric is built strictly from the question without seeing your answer, preventing examiner bias.
          </p>
        </div>
      </div>
    </div>
  );
};

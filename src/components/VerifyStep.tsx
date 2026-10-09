import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  PenTool,
  CheckSquare,
} from 'lucide-react';
import { Rubric, VisionTranscription } from '../types/index.ts';
import { ProcessedImage } from '../utils/imageProcessor.ts';

interface VerifyStepProps {
  question: string;
  marks: number;
  rubric: Rubric;
  transcription: VisionTranscription;
  processedImage: ProcessedImage | null;
  onConfirm: (data: {
    verifiedTranscript: string;
    hasDiagram: boolean;
    diagramDescription: string;
  }) => void;
  onBack: () => void;
}

export const VerifyStep: React.FC<VerifyStepProps> = ({
  question,
  marks,
  rubric,
  transcription,
  processedImage,
  onConfirm,
  onBack,
}) => {
  // Editable state
  const [transcript, setTranscript] = useState(transcription.transcript);
  const [hasDiagram, setHasDiagram] = useState(transcription.has_diagram);
  const [diagramDescription, setDiagramDescription] = useState(
    transcription.diagram_description || ''
  );

  // Image pan & zoom controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(3.5, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, z - 0.25));
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleHighlightUncertainWord = (word: string) => {
    if (!textareaRef.current) return;
    const pos = transcript.toLowerCase().indexOf(word.toLowerCase());
    if (pos !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos + word.length);
    }
  };

  return (
    <div className="space-y-6">
      {/* HUMAN CHECKPOINT AMBER BANNER */}
      <div className="bg-amber-50 border-2 border-[#F5A524] rounded-2xl p-4 sm:p-5 shadow-sm text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5A524] text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                Human Checkpoint
              </span>
              <span className="text-xs text-amber-800 font-medium">
                Step 3 of 5
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-amber-950 mt-0.5">
              Fix anything Gemini misread. Your marks are based on this text.
            </h3>
            <p className="text-xs sm:text-sm text-amber-900/80 mt-0.5">
              Review uncertain words, verify diagram detection, and correct transcription discrepancies before scoring.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-mono bg-white/80 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-lg">
            Legibility: <strong className="capitalize">{transcription.legibility}</strong>
          </span>
        </div>
      </div>

      {/* Warnings for legibility or relevance if triggered */}
      {transcription.legibility === 'poor' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center gap-3 text-rose-900 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong>Challenging handwriting detected:</strong> Some words may have been transcribed inaccurately. Please review the right pane line by line.
          </span>
        </div>
      )}

      {!transcription.is_relevant_to_question && (
        <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3.5 flex items-center gap-3 text-amber-950 text-xs sm:text-sm">
          <HelpCircle className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            <strong>Relevance note:</strong> The handwriting appears to be only loosely related to the prompt. Ensure your answer is complete before scoring.
          </span>
        </div>
      )}

      {/* SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: ORIGINAL PHOTO WITH ZOOM/PAN/ROTATE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-sm font-bold text-[#1B2A4A] flex items-center gap-1.5">
              <span>Original Answer Sheet</span>
              <span className="text-xs font-normal text-slate-400">(Interactive Zoom & Pan)</span>
            </span>

            {/* Interactive Image Toolbar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom in"
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom out"
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90 degrees"
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetView}
                title="Reset view"
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Image Viewport */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-full h-[460px] bg-slate-900 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center select-none"
          >
            {processedImage?.dataUrl ? (
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                }}
                className="max-w-none origin-center"
              >
                <img
                  src={processedImage.dataUrl}
                  alt="Student original handwritten answer"
                  draggable={false}
                  className="max-h-[420px] object-contain rounded shadow-2xl pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-slate-400 text-sm">No photo available (Demo text mode)</div>
            )}

            <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-0.5 rounded">
              Zoom: {Math.round(zoom * 100)}% | Rot: {rotation}°
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Click & drag to pan around handwritten lines. Double-check difficult formulas or cursive words.
          </p>
        </div>

        {/* RIGHT COLUMN: EDITABLE VERBATIM TRANSCRIPT */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-[#1B2A4A] flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-[#E8532B]" />
                Verbatim Transcript (Editable)
              </label>
              <span className="text-xs text-slate-400">
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={12}
              className="w-full font-mono text-sm leading-relaxed p-4 rounded-xl border border-slate-300 focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20 text-[#1B2A4A] bg-white transition-all resize-y"
              placeholder="Verbatim text from handwritten sheet..."
            />
          </div>

          {/* Uncertain Words Highlights */}
          {transcription.uncertain_words && transcription.uncertain_words.length > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F5A524]" />
                Gemini flagged these words as difficult to decipher (click to find in text):
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {transcription.uncertain_words.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleHighlightUncertainWord(w)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-950 font-mono hover:bg-amber-100 transition shadow-2xs"
                  >
                    "{w}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Diagram Override Checkbox & Description */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasDiagram}
                onChange={(e) => setHasDiagram(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#F5A524] rounded border-slate-300 focus:ring-[#F5A524]"
              />
              <div>
                <span className="text-sm font-bold text-[#1B2A4A]">
                  My answer includes a diagram, flowchart, or schema
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm whether your answer sheet contains hand-drawn sketches or architecture tables.
                </p>
              </div>
            </label>

            {hasDiagram && (
              <div className="pt-2 pl-7 space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Diagram notes / description:
                </label>
                <input
                  type="text"
                  value={diagramDescription}
                  onChange={(e) => setDiagramDescription(e.target.value)}
                  placeholder="e.g. Table schema with arrows, 3-tier client/server diagram"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-[#F5A524] focus:outline-none bg-white text-[#1B2A4A]"
                />
              </div>
            )}
          </div>

          {/* Question & Rubric preview pill */}
          <div className="text-xs text-slate-500 bg-slate-100/80 p-3 rounded-xl flex items-center justify-between">
            <div>
              Question: <strong>{question.slice(0, 50)}...</strong> ({marks} Marks)
            </div>
            <span className="font-semibold text-slate-700">
              {rubric.criteria.length} criteria in rubric
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Question
            </button>

            <button
              type="button"
              disabled={transcript.trim().length === 0}
              onClick={() =>
                onConfirm({
                  verifiedTranscript: transcript,
                  hasDiagram,
                  diagramDescription,
                })
              }
              className={`w-full sm:w-auto flex-1 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                transcript.trim().length > 0
                  ? 'bg-[#E8532B] hover:bg-[#d64722] text-white shadow-orange-500/25 cursor-pointer transform hover:-translate-y-0.5'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Confirm & Score Answer</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

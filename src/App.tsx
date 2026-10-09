import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { Stepper } from './components/Stepper.tsx';
import { QuestionStep } from './components/QuestionStep.tsx';
import { AnalyzingStep } from './components/AnalyzingStep.tsx';
import { VerifyStep } from './components/VerifyStep.tsx';
import { EvaluatingStep } from './components/EvaluatingStep.tsx';
import { ResultsStep } from './components/ResultsStep.tsx';
import {
  FinalScoreReport,
  Rubric,
  StepNumber,
  VisionTranscription,
} from './types/index.ts';
import { ProcessedImage } from './utils/imageProcessor.ts';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Stepper flow state
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<StepNumber>(1);

  // Question & Upload State
  const [question, setQuestion] = useState(
    'Explain normalization in DBMS with an example. Mention 1NF, 2NF and 3NF.'
  );
  const [marks, setMarks] = useState<2 | 5 | 10>(5);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(
    null
  );
  const [sampleTranscript, setSampleTranscript] = useState('');

  // Step 2 outputs: Rubric & Vision Transcription
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [transcription, setTranscription] =
    useState<VisionTranscription | null>(null);

  // Step 3 Human Checkpoint outputs
  const [verifiedTranscript, setVerifiedTranscript] = useState('');
  const [hasDiagram, setHasDiagram] = useState(false);
  const [diagramDescription, setDiagramDescription] = useState('');

  // Step 5 Evaluation & Scoring output
  const [scoreReport, setScoreReport] = useState<FinalScoreReport | null>(null);

  // Re-attempt score delta tracking
  const [previousAwardedMarks, setPreviousAwardedMarks] = useState<
    number | null
  >(null);
  const [isReattempt, setIsReattempt] = useState(false);

  // Error and Loading states
  const [error, setError] = useState<string | null>(null);

  /**
   * Run parallel Step 2: Rubric + Vision
   */
  const handleStartAnalysis = async () => {
    setError(null);
    setCurrentStep(2);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          totalMarks: marks,
          imageBase64: processedImage?.base64 || '',
          mimeType: processedImage?.mimeType || 'image/jpeg',
          sampleTranscript,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze answer.');
      }

      setRubric(data.rubric);
      setTranscription(data.transcription);
      setVerifiedTranscript(data.transcription.transcript);
      setHasDiagram(data.transcription.has_diagram);
      setDiagramDescription(data.transcription.diagram_description || '');

      // Advance to Step 3: Human Checkpoint
      setCurrentStep(3);
      setMaxCompletedStep((prev) => (prev < 3 ? 3 : prev) as StepNumber);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(
        err.message || 'Analysis encountered an error. Please retry.'
      );
      setCurrentStep(1);
    }
  };

  /**
   * Run Step 4 & 5: Evaluate & Score after human verification
   */
  const handleConfirmAndScore = async (data: {
    verifiedTranscript: string;
    hasDiagram: boolean;
    diagramDescription: string;
  }) => {
    if (!rubric) return;

    setError(null);
    setVerifiedTranscript(data.verifiedTranscript);
    setHasDiagram(data.hasDiagram);
    setDiagramDescription(data.diagramDescription);
    setCurrentStep(4);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          marks,
          rubric,
          verifiedTranscript: data.verifiedTranscript,
          hasDiagram: data.hasDiagram,
          diagramDescription: data.diagramDescription,
          legibility: transcription?.legibility || 'good',
        }),
      });

      const reportData: FinalScoreReport = await response.json();

      if (!response.ok) {
        throw new Error((reportData as any).error || 'Evaluation failed.');
      }

      setScoreReport(reportData);
      setCurrentStep(5);
      setMaxCompletedStep(5);
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setError(
        err.message ||
          'Failed to complete evaluation. Please review your transcript and retry.'
      );
      setCurrentStep(3);
    }
  };

  /**
   * Re-attempt flow: keeps identical question and rubric for clean delta comparison
   */
  const handleReattempt = () => {
    if (scoreReport) {
      setPreviousAwardedMarks(scoreReport.awarded_marks);
    }
    setIsReattempt(true);
    setProcessedImage(null);
    setSampleTranscript('');
    setTranscription(null);
    setScoreReport(null);
    setCurrentStep(1);
  };

  /**
   * Reset flow to new question
   */
  const handleNewQuestion = () => {
    setIsReattempt(false);
    setPreviousAwardedMarks(null);
    setProcessedImage(null);
    setSampleTranscript('');
    setRubric(null);
    setTranscription(null);
    setScoreReport(null);
    setError(null);
    setCurrentStep(1);
    setMaxCompletedStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5FA] text-[#1B2A4A] font-sans antialiased">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top Stepper Navigation */}
        <div className="print:hidden">
          <Stepper
            currentStep={currentStep}
            maxCompletedStep={maxCompletedStep}
            onStepClick={(step) => {
              if (step <= maxCompletedStep) {
                setCurrentStep(step);
              }
            }}
          />
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold">Action Needed:</strong>
                <p className="text-xs sm:text-sm mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step Views */}
        {currentStep === 1 && (
          <QuestionStep
            question={question}
            setQuestion={setQuestion}
            marks={marks}
            setMarks={setMarks}
            processedImage={processedImage}
            setProcessedImage={setProcessedImage}
            sampleTranscript={sampleTranscript}
            setSampleTranscript={setSampleTranscript}
            onStartAnalysis={handleStartAnalysis}
            isReattempt={isReattempt}
          />
        )}

        {currentStep === 2 && (
          <AnalyzingStep question={question} marks={marks} />
        )}

        {currentStep === 3 && transcription && rubric && (
          <VerifyStep
            question={question}
            marks={marks}
            rubric={rubric}
            transcription={transcription}
            processedImage={processedImage}
            onConfirm={handleConfirmAndScore}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 4 && <EvaluatingStep />}

        {currentStep === 5 && scoreReport && (
          <ResultsStep
            report={scoreReport}
            question={question}
            previousAwardedMarks={previousAwardedMarks}
            onReattempt={handleReattempt}
            onNewQuestion={handleNewQuestion}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateRubric } from './server/rubricService.ts';
import { transcribeHandwriting } from './server/visionService.ts';
import { evaluateAnswer } from './server/evaluationService.ts';
import { calculateScore } from './server/scoreEngine.ts';
import { getGeminiModel } from './server/geminiClient.ts';
import {
  Rubric,
  verifyEvidenceQuote,
  VisionTranscription,
} from './server/validators.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsers: allow up to 15MB for compressed image payloads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'AnswerLens',
    model: getGeminiModel(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

/**
 * STEP 2: ANALYZE
 * Runs Rubric generation and Vision transcription in PARALLEL.
 * The rubric call NEVER sees the student's handwritten answer.
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { question, totalMarks, imageBase64, mimeType, sampleTranscript } =
      req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    const marks = Number(totalMarks) || 5;
    if (![2, 5, 10].includes(marks)) {
      return res
        .status(400)
        .json({ error: 'Marks must be one of: 2, 5, or 10.' });
    }

    // Parallel execution
    const rubricPromise = generateRubric(question, marks);

    const visionPromise: Promise<VisionTranscription> = (async () => {
      if (imageBase64 && imageBase64.length > 50) {
        return await transcribeHandwriting(
          imageBase64,
          mimeType || 'image/jpeg',
          question
        );
      } else if (sampleTranscript) {
        // Demo mode without image upload
        return {
          transcript: sampleTranscript,
          uncertain_words: [],
          has_diagram: sampleTranscript.toLowerCase().includes('diagram') || sampleTranscript.toLowerCase().includes('table'),
          diagram_description: 'Sample schematic provided in demo mode',
          legibility: 'good',
          is_relevant_to_question: true,
        };
      } else {
        throw new Error('Either an answer image or a sample transcript is required.');
      }
    })();

    const [rubric, transcription] = await Promise.all([
      rubricPromise,
      visionPromise,
    ]);

    return res.json({
      rubric,
      transcription,
    });
  } catch (err: any) {
    console.error('Error in /api/analyze:', err);
    return res.status(500).json({
      error:
        err.message ||
        'Failed to analyze answer. Please check your image clarity and retry.',
    });
  }
});

/**
 * STEP 4 & 5: EVALUATE & SCORE
 * Evaluates the human-verified transcript and applies the deterministic scoreEngine.
 * Enforces the Evidence Guard with a 1-retry fallback.
 */
app.post('/api/evaluate', async (req, res) => {
  try {
    const {
      question,
      marks,
      rubric,
      verifiedTranscript,
      hasDiagram,
      diagramDescription,
      legibility,
    } = req.body;

    if (!question || !rubric || !verifiedTranscript) {
      return res.status(400).json({
        error:
          'Question, rubric, and verified transcript are required for evaluation.',
      });
    }

    const safeRubric: Rubric = rubric;
    const cleanTranscript: string = verifiedTranscript.trim();

    // 1. Initial Evaluation Call
    let rawEvaluation = await evaluateAnswer({
      question,
      marks: Number(marks) || 5,
      rubric: safeRubric,
      verifiedTranscript: cleanTranscript,
      hasDiagram: Boolean(hasDiagram),
      diagramDescription,
    });

    // 2. Evidence Guard check: verify if any quotes failed
    const failedQuotes = rawEvaluation.evaluations.filter(
      (ev) =>
        (ev.status === 'present' || ev.status === 'partial') &&
        ev.evidence_quote &&
        !verifyEvidenceQuote(cleanTranscript, ev.evidence_quote)
    );

    // If failed, re-ask Gemini once as required by the spec
    if (failedQuotes.length > 0) {
      console.warn(
        `[Evidence Guard] Detected ${failedQuotes.length} quotes not matching transcript. Re-evaluating once...`
      );
      try {
        const retryEval = await evaluateAnswer({
          question: `${question}\nNOTE: Ensure all evidence quotes are EXACT substrings from the transcript below.`,
          marks: Number(marks) || 5,
          rubric: safeRubric,
          verifiedTranscript: cleanTranscript,
          hasDiagram: Boolean(hasDiagram),
          diagramDescription,
        });
        rawEvaluation = retryEval;
      } catch (retryErr) {
        console.warn('[Evidence Guard] Retry failed, proceeding to scoreEngine fallback', retryErr);
      }
    }

    // 3. Deterministic scoring through scoreEngine (Pure server code)
    const report = calculateScore(
      safeRubric,
      rawEvaluation,
      cleanTranscript,
      Boolean(hasDiagram),
      legibility || 'good'
    );

    return res.json(report);
  } catch (err: any) {
    console.error('Error in /api/evaluate:', err);
    return res.status(500).json({
      error:
        err.message ||
        'Failed to evaluate answer. Please verify the transcript and try again.',
    });
  }
});

// Setup Vite development server or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite middleware for development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AnswerLens server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

# AnswerLens - AI Examiner for Handwritten Answers

> **"Check your marks before the examiner does."**  
> Built for HackDays 2.0 (Best Use of Google Gemini API) by **Team ERROR 404**.

---

## 🎯 Core Principle

> **Gemini understands and evaluates. The student verifies. Our code calculates. AnswerLens explains.**  
> Gemini must **NEVER** output a numerical mark or score. Only our deterministic server code calculates marks.

---

## 🏛️ System Architecture

AnswerLens is built with a decoupled client-server architecture:
- **Frontend**: React (Vite + Tailwind CSS), mobile-first responsive UI with touch zoom/pan and camera capture.
- **Backend**: Node.js + Express with `@google/genai` TypeScript SDK.
- **Security**: The browser never sees `GEMINI_API_KEY`. All Gemini operations are performed server-side with strict JSON response schemas (`responseSchema`) and temperature `0.2`.
- **Parallel Pipeline**: Step 2 fires two isolated Gemini calls concurrently via `Promise.all`:
  1. **Rubric Synthesis**: Creates an objective marking scheme from the **question and marks ONLY**. It never sees the student's answer, preventing bias.
  2. **Verbatim Vision Transcription**: Transcribes student handwriting verbatim without correcting spelling, grammar, or factual mistakes, preserving student errors for authentic academic grading.

---

## 🔁 5-Step Workflow

1. **Step 1: Question & Paper Submission**
   - Question input, marks selector (`2` / `5` / `10` marks).
   - Drag-and-drop or camera capture on mobile.
   - Client-side EXIF orientation correction, downscaling to max 1600px, JPEG compression, and <8MB cap.
   - Demo mode with one-click presets (e.g. 5-mark DBMS Normalization).

2. **Step 2: Dual Parallel Analysis**
   - Parallel execution of `rubricService` and `visionService`.
   - Step-wise animated status indicators.
   - Rubric weights normalized to sum exactly to total marks.

3. **Step 3: Human Checkpoint (Amber Highlighted)**
   - Split view: left side has interactive zoom, pan, and rotate controls for the original handwritten paper.
   - Right side has an editable transcript with flagged uncertain words highlighted.
   - Banner: *"Fix anything Gemini misread. Your marks are based on this text."*
   - Checkbox to confirm or override whether the answer has a diagram.
   - Nothing is scored until the student confirms.

4. **Step 4: Strict University Evaluation**
   - Untrusted input defense: prompts instruct Gemini to ignore any prompt injection or grading commands inside the answer.
   - Strict qualitative judgment: `present` (1.0x), `partial` (0.5x), or `missing` (0.0x) per criterion.
   - Requires verbatim `evidence_quote` for non-missing points.

5. **Step 5: Score Engine & Results Dashboard**
   - **Evidence Guard**: Server verifies that every `evidence_quote` exists in the student's transcript using normalized fuzzy matching. Hallucinated quotes receive 0 marks.
   - Score formula: `weight * multiplier`, rounded to nearest 0.5, capped at total marks.
   - Animated circular score gauge with percentage.
   - "Marks Lost" strip at the top.
   - Criterion-by-criterion breakdown cards with in-text quotes and examiner reasoning.
   - Side-by-side comparison with benchmark Model Answer and missing keywords highlighted.
   - Senior's Review with Hinglish vs English toggle (Roman-script guidance like a helpful senior).
   - Re-attempt button (keeps same question and rubric, tracks score delta like `+1.5 Marks`).
   - Copy report and print-friendly export.

---

## 📁 File Structure

```text
├── server/
│   ├── geminiClient.ts         # Server-side Gemini client with 'aistudio-build' telemetry
│   ├── rubricService.ts        # Isolated rubric generator with weight normalizer
│   ├── visionService.ts        # Verbatim handwriting transcription & diagram detector
│   ├── evaluationService.ts    # Qualitative evaluation & anti-injection guard
│   ├── scoreEngine.ts          # Pure function scoring engine & Evidence Guard
│   ├── scoreEngine.test.ts     # Unit tests for scoring, caps, and evidence verification
│   └── validators.ts           # Types, JSON parsers, and fuzzy quote verification
├── src/
│   ├── components/
│   │   ├── Stepper.tsx         # 5-step progress stepper with amber checkpoint
│   │   ├── QuestionStep.tsx    # Step 1 input form, file processing & presets
│   │   ├── AnalyzingStep.tsx   # Step 2 parallel execution animation
│   │   ├── VerifyStep.tsx      # Step 3 split-view zoom/pan & human verification
│   │   ├── EvaluatingStep.tsx  # Step 4 evaluation loader & principle callout
│   │   ├── ResultsStep.tsx     # Step 5 results dashboard, score ring & toggle
│   │   ├── Header.tsx          # Brand header & tagline
│   │   └── Footer.tsx          # Team ERROR 404 HackDays 2.0 footer
│   ├── data/
│   │   └── samplePresets.ts    # 2, 5, and 10 mark sample questions with handwriting SVG
│   ├── utils/
│   │   └── imageProcessor.ts   # EXIF rotation, canvas resize & JPEG compressor
│   ├── types/
│   │   └── index.ts            # Client TypeScript interfaces
│   ├── App.tsx                 # Root state machine & API handlers
│   ├── main.tsx                # React DOM entry
│   └── index.css               # Tailwind CSS & print media queries
├── server.ts                   # Express server with Vite middleware integration
├── package.json
└── tsconfig.json
```

---

## 🚀 Setup & Execution

### 1. Environment Variables
Copy `.env.example` to `.env` (or set in AI Studio Secrets):
```bash
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.8-flash"
PORT=3000
```

### 2. Run Development Server
```bash
npm run dev
```
The full-stack application will run on `http://localhost:3000`.

### 3. Run Unit Tests
```bash
npm test
```
Executes the test suite in `server/scoreEngine.test.ts` covering weight calculations, Evidence Guard verification, hallucination rejection, and score caps.

---

## 🔮 Roadmap (Out of Scope for MVP)
- User accounts & profile authentication
- Multi-attempt historical tracking & progress graphs
- Weak-topic diagnostic analytics
- University teacher / instructor review dashboard

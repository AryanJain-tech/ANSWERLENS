import assert from 'node:assert';
import { calculateScore } from './scoreEngine.ts';
import { RawEvaluationOutput, Rubric } from './validators.ts';

console.log('🧪 Starting AnswerLens ScoreEngine Unit Tests...');

// 1. Basic 5-mark evaluation with present, partial, and missing criteria
{
  const rubric: Rubric = {
    total_marks: 5,
    diagram_required: false,
    criteria: [
      {
        id: 'c1',
        type: 'definition',
        description: 'Define 1NF',
        weight: 1.5,
        keywords: ['atomic', 'values'],
      },
      {
        id: 'c2',
        type: 'explanation',
        description: 'Explain 2NF and partial dependency',
        weight: 1.5,
        keywords: ['partial', 'dependency'],
      },
      {
        id: 'c3',
        type: 'example',
        description: 'Provide tabular example',
        weight: 2.0,
        keywords: ['table', 'columns'],
      },
    ],
  };

  const transcript =
    'Normalization is process to remove redundancy. 1NF requires atomic values in all columns. 2NF removes partial dependency.';

  const rawEval: RawEvaluationOutput = {
    model_answer: 'Model answer text',
    explanation_hinglish: 'Bhai badhiya likha hai',
    explanation_english: 'Good effort',
    top_improvement_tip: 'Add example',
    evaluations: [
      {
        id: 'c1',
        status: 'present',
        evidence_quote: '1NF requires atomic values in all columns',
        reason: 'Well defined atomic values',
      },
      {
        id: 'c2',
        status: 'partial',
        evidence_quote: '2NF removes partial dependency',
        reason: 'Mentioned but lacked full candidate key explanation',
      },
      {
        id: 'c3',
        status: 'missing',
        evidence_quote: '',
        reason: 'No table or example provided',
      },
    ],
  };

  const report = calculateScore(rubric, rawEval, transcript, false);

  // c1: 1.5 * 1.0 = 1.5
  // c2: 1.5 * 0.5 = 0.75 -> rounded to 1.0 (nearest 0.5)
  // c3: 2.0 * 0.0 = 0.0
  // Total awarded: 1.5 + 1.0 + 0 = 2.5 / 5.0
  assert.strictEqual(report.total_marks, 5);
  assert.strictEqual(report.awarded_marks, 2.5);
  assert.strictEqual(report.percentage, 50);
  assert.strictEqual(report.marks_lost_summary.length, 2);
  console.log('✅ Test 1 Passed: 5-mark mixed scoring with 0.5 rounding');
}

// 2. EVIDENCE GUARD: Hallucinated / Fabricated Quote Rejection
{
  const rubric: Rubric = {
    total_marks: 2,
    diagram_required: false,
    criteria: [
      {
        id: 'c1',
        type: 'definition',
        description: 'Define deadlock',
        weight: 2.0,
        keywords: ['deadlock', 'processes'],
      },
    ],
  };

  const transcript = 'Deadlock is when two cars meet at a bridge.';

  // Evaluator claims "present" with a quote that student never wrote
  const fakeEval: RawEvaluationOutput = {
    model_answer: 'A deadlock is a set of blocked processes...',
    explanation_hinglish: 'Dhyan de',
    explanation_english: 'Notice',
    top_improvement_tip: 'Define mutual exclusion',
    evaluations: [
      {
        id: 'c1',
        status: 'present',
        evidence_quote: 'A deadlock is a state where each process waits for a resource held by another',
        reason: 'Perfect definition',
      },
    ],
  };

  const report = calculateScore(rubric, fakeEval, transcript, false);

  // Evidence Guard must reject hallucinated quote:
  // Awarded marks MUST be 0.
  assert.strictEqual(report.awarded_marks, 0);
  assert.strictEqual(report.criteria[0].evidence_valid, false);
  assert.strictEqual(report.criteria[0].status, 'missing');
  assert.match(report.criteria[0].reason, /No quotable evidence found/i);
  console.log('✅ Test 2 Passed: Evidence Guard strictly rejects hallucinated quotes');
}

// 3. Score Cap enforcement (never exceeds total marks)
{
  const rubric: Rubric = {
    total_marks: 2,
    diagram_required: false,
    criteria: [
      {
        id: 'c1',
        type: 'definition',
        weight: 1.5,
        description: 'Part A',
        keywords: [],
      },
      {
        id: 'c2',
        type: 'definition',
        weight: 1.5,
        description: 'Part B',
        keywords: [],
      },
    ],
  };

  const transcript = 'Part A defined. Part B defined.';
  const rawEval: RawEvaluationOutput = {
    model_answer: '',
    explanation_hinglish: '',
    explanation_english: '',
    top_improvement_tip: '',
    evaluations: [
      { id: 'c1', status: 'present', evidence_quote: 'Part A defined', reason: 'ok' },
      { id: 'c2', status: 'present', evidence_quote: 'Part B defined', reason: 'ok' },
    ],
  };

  const report = calculateScore(rubric, rawEval, transcript, false);
  // 1.5 + 1.5 = 3.0, but total_marks is 2. Capped at 2.
  assert.strictEqual(report.awarded_marks, 2.0);
  assert.strictEqual(report.percentage, 100);
  console.log('✅ Test 3 Passed: Total score capped at question marks');
}

// 4. Diagram Criterion handling
{
  const rubric: Rubric = {
    total_marks: 5,
    diagram_required: true,
    criteria: [
      {
        id: 'd1',
        type: 'diagram',
        weight: 2.0,
        description: 'Draw 3-tier architecture diagram',
        keywords: ['client', 'server', 'database'],
      },
      {
        id: 'd2',
        type: 'explanation',
        weight: 3.0,
        description: 'Explain tiers',
        keywords: ['presentation', 'logic', 'data'],
      },
    ],
  };

  const transcript = 'Presentation tier handles UI. Logic tier handles rules. Data tier stores data.';
  const rawEval: RawEvaluationOutput = {
    model_answer: '',
    explanation_hinglish: '',
    explanation_english: '',
    top_improvement_tip: '',
    evaluations: [
      { id: 'd1', status: 'present', evidence_quote: '', reason: 'Diagram drawn' },
      { id: 'd2', status: 'present', evidence_quote: 'Presentation tier handles UI', reason: 'Good' },
    ],
  };

  // Student did NOT include diagram
  const reportNoDiagram = calculateScore(rubric, rawEval, transcript, false);
  assert.strictEqual(reportNoDiagram.criteria[0].status, 'missing');
  assert.strictEqual(reportNoDiagram.criteria[0].marks_awarded, 0);

  // Student DID include diagram
  const reportWithDiagram = calculateScore(rubric, rawEval, transcript, true);
  assert.strictEqual(reportWithDiagram.criteria[0].marks_awarded, 2.0);
  console.log('✅ Test 4 Passed: Diagram criterion correctly conditioned on student verification');
}

console.log('🎉 All AnswerLens ScoreEngine unit tests PASSED successfully!\n');

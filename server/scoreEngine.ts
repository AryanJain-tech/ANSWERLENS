import {
  CriterionEvaluation,
  FinalScoreReport,
  RawEvaluationOutput,
  Rubric,
  ScoredCriterion,
  verifyEvidenceQuote,
} from './validators.ts';

/**
 * Pure function scoring engine.
 * GEMINI NEVER CALCULATES MARKS. ONLY THIS DETERMINISTIC ENGINE CALCULATES MARKS.
 *
 * Scoring Formula:
 * marks per criterion = weight * (present ? 1.0 : partial ? 0.5 : 0.0)
 * rounded to nearest 0.5.
 *
 * EVIDENCE GUARD:
 * Checks that each evidence_quote actually exists in the student's verified transcript
 * using normalized fuzzy matching.
 * If evidence quote fails verification (hallucinated or fabricated quote):
 *   - evidence_valid = false
 *   - marks awarded = 0
 *   - reason specifies "no quotable evidence found"
 */
export function calculateScore(
  rubric: Rubric,
  rawEvaluation: RawEvaluationOutput,
  verifiedTranscript: string,
  hasDiagram: boolean,
  legibility: 'good' | 'fair' | 'poor' = 'good'
): FinalScoreReport {
  const evalMap = new Map<string, CriterionEvaluation>();
  for (const item of rawEvaluation.evaluations) {
    evalMap.set(item.id, item);
  }

  const scoredCriteria: ScoredCriterion[] = [];
  let rawTotalAwarded = 0;

  for (const crit of rubric.criteria) {
    const evaluation = evalMap.get(crit.id) || {
      id: crit.id,
      status: 'missing' as const,
      evidence_quote: '',
      reason: 'No evaluation provided for this criterion.',
    };

    let status = evaluation.status;
    let evidenceQuote = evaluation.evidence_quote || '';
    let reason = evaluation.reason || '';
    let evidenceValid = true;

    // Special diagram criterion handling
    const isDiagramCriterion = crit.type === 'diagram';

    if (isDiagramCriterion) {
      if (!hasDiagram) {
        status = 'missing';
        reason = reason || 'No diagram drawn by student.';
      } else if (status === 'missing') {
        // If student confirmed diagram, but examiner said missing, mark partial or accept diagram
        status = 'partial';
        reason = reason || 'Diagram present as confirmed by student.';
      }
      evidenceValid = true;
    } else {
      // Evidence guard for text-based criteria
      if (status === 'present' || status === 'partial') {
        if (!evidenceQuote || evidenceQuote.trim().length === 0) {
          evidenceValid = false;
          status = 'missing';
          reason = 'No quotable evidence found in student transcript.';
        } else {
          const matchOk = verifyEvidenceQuote(verifiedTranscript, evidenceQuote);
          if (!matchOk) {
            evidenceValid = false;
            status = 'missing';
            reason = `No quotable evidence found: citation "${evidenceQuote.slice(0, 40)}..." was not present in transcript.`;
          }
        }
      } else {
        evidenceValid = true;
      }
    }

    // Deterministic calculation
    let multiplier = 0;
    if (status === 'present' && evidenceValid) {
      multiplier = 1.0;
    } else if (status === 'partial' && evidenceValid) {
      multiplier = 0.5;
    } else {
      multiplier = 0.0;
    }

    // Rounded to nearest 0.5
    const marksAwarded = Math.round(crit.weight * multiplier * 2) / 2;
    const marksLost = Math.max(0, crit.weight - marksAwarded);
    rawTotalAwarded += marksAwarded;

    scoredCriteria.push({
      ...crit,
      status,
      evidence_quote: evidenceQuote,
      reason,
      marks_awarded: marksAwarded,
      marks_lost: marksLost,
      evidence_valid: evidenceValid,
    });
  }

  // Total capped at question marks
  const totalAwarded = Math.min(
    rubric.total_marks,
    Math.round(rawTotalAwarded * 2) / 2
  );

  const percentage =
    rubric.total_marks > 0
      ? Math.round((totalAwarded / rubric.total_marks) * 100)
      : 0;

  const marksLostSummary = scoredCriteria
    .filter((c) => c.marks_lost > 0)
    .map((c) => ({
      criterion_id: c.id,
      description: c.description,
      lost: c.marks_lost,
      reason: c.reason,
    }));

  return {
    total_marks: rubric.total_marks,
    awarded_marks: totalAwarded,
    percentage,
    criteria: scoredCriteria,
    marks_lost_summary: marksLostSummary,
    model_answer: rawEvaluation.model_answer || '',
    explanation_hinglish: rawEvaluation.explanation_hinglish || '',
    explanation_english: rawEvaluation.explanation_english || '',
    top_improvement_tip: rawEvaluation.top_improvement_tip || '',
    verified_transcript: verifiedTranscript,
    has_diagram: hasDiagram,
    legibility,
  };
}

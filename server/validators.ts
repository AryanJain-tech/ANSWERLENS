export type CriterionType =
  | 'definition'
  | 'concept'
  | 'explanation'
  | 'keyword'
  | 'example'
  | 'diagram';

export interface RubricCriterion {
  id: string;
  type: CriterionType;
  description: string;
  weight: number;
  keywords: string[];
}

export interface Rubric {
  total_marks: number;
  criteria: RubricCriterion[];
  diagram_required: boolean;
}

export interface VisionTranscription {
  transcript: string;
  uncertain_words: string[];
  has_diagram: boolean;
  diagram_description: string;
  legibility: 'good' | 'fair' | 'poor';
  is_relevant_to_question: boolean;
}

export interface CriterionEvaluation {
  id: string;
  status: 'present' | 'partial' | 'missing';
  evidence_quote: string;
  reason: string;
}

export interface RawEvaluationOutput {
  evaluations: CriterionEvaluation[];
  model_answer: string;
  explanation_hinglish: string;
  explanation_english: string;
  top_improvement_tip: string;
}

export interface ScoredCriterion extends RubricCriterion {
  status: 'present' | 'partial' | 'missing';
  evidence_quote: string;
  reason: string;
  marks_awarded: number;
  marks_lost: number;
  evidence_valid: boolean;
}

export interface FinalScoreReport {
  total_marks: number;
  awarded_marks: number;
  percentage: number;
  criteria: ScoredCriterion[];
  marks_lost_summary: Array<{
    criterion_id: string;
    description: string;
    lost: number;
    reason: string;
  }>;
  model_answer: string;
  explanation_hinglish: string;
  explanation_english: string;
  top_improvement_tip: string;
  verified_transcript: string;
  has_diagram: boolean;
  legibility: 'good' | 'fair' | 'poor';
}

/**
 * Normalizes text for lenient fuzzy evidence comparison:
 * Lowercases, collapses whitespace, strips punctuation and non-alphanumeric chars.
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if candidate quote exists within student transcript using normalized comparison.
 * Allows slight transcription boundary deviations.
 */
export function verifyEvidenceQuote(
  transcript: string,
  quote: string
): boolean {
  if (!quote || quote.trim().length === 0) {
    return false;
  }
  const normTranscript = normalizeText(transcript);
  const normQuote = normalizeText(quote);

  if (!normQuote) return false;

  // Direct normalized substring search
  if (normTranscript.includes(normQuote)) {
    return true;
  }

  // If quote is reasonably long (>= 15 chars), check if 80% prefix or suffix exists
  if (normQuote.length >= 20) {
    const prefix = normQuote.slice(0, Math.floor(normQuote.length * 0.75));
    if (normTranscript.includes(prefix)) {
      return true;
    }
  }

  // Token sequence overlap check
  const quoteTokens = normQuote.split(' ').filter((w) => w.length > 2);
  if (quoteTokens.length >= 4) {
    const matchedTokens = quoteTokens.filter((token) =>
      normTranscript.includes(token)
    );
    if (matchedTokens.length / quoteTokens.length >= 0.8) {
      return true;
    }
  }

  return false;
}

/**
 * Safely parses JSON response and handles markdown code fences
 */
export function safeParseJson<T>(rawText: string | undefined): T | null {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('JSON parsing failed:', err, 'Raw text:', rawText);
    return null;
  }
}

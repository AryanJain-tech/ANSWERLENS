export type StepNumber = 1 | 2 | 3 | 4 | 5;

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

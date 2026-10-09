import { Type } from '@google/genai';
import { ai, callGeminiWithRetry, getGeminiModel } from './geminiClient.ts';
import { Rubric, RubricCriterion, safeParseJson } from './validators.ts';

/**
 * Enforces strict mathematical weight invariant on rubric criteria:
 * - Each weight must be a positive multiple of 0.5 (min 0.5)
 * - The sum of all weights must EXACTLY equal the question totalMarks
 */
export function normalizeRubricWeights(
  rawCriteria: RubricCriterion[],
  totalMarks: number
): RubricCriterion[] {
  if (!rawCriteria || rawCriteria.length === 0) {
    // Fallback default criteria
    return [
      {
        id: 'crit-1',
        type: 'concept',
        description: 'Core explanation and technical accuracy',
        weight: totalMarks / 2,
        keywords: ['core', 'accuracy'],
      },
      {
        id: 'crit-2',
        type: 'example',
        description: 'Illustrative example or practical application',
        weight: totalMarks / 2,
        keywords: ['example', 'use-case'],
      },
    ];
  }

  // 1. Round each weight to nearest 0.5 (minimum 0.5)
  const criteria = rawCriteria.map((c, idx) => ({
    ...c,
    id: c.id || `crit-${idx + 1}`,
    weight: Math.max(0.5, Math.round(Number(c.weight || 1) * 2) / 2),
    keywords: Array.isArray(c.keywords) ? c.keywords : [],
  }));

  // 2. Adjust remainder to match totalMarks exactly in 0.5 increments
  let currentSum = criteria.reduce((sum, c) => sum + c.weight, 0);
  let attempts = 0;

  while (Math.abs(currentSum - totalMarks) >= 0.25 && attempts < 20) {
    attempts++;
    const diff = totalMarks - currentSum;
    if (diff > 0) {
      // Need to add marks: add 0.5 to the criterion with highest weight (or first)
      const target = criteria.reduce((max, c) => (c.weight > max.weight ? c : max), criteria[0]);
      target.weight = Math.round((target.weight + 0.5) * 2) / 2;
    } else {
      // Need to subtract marks: subtract 0.5 from criterion with highest weight (> 0.5)
      const eligible = criteria.filter((c) => c.weight > 0.5);
      if (eligible.length > 0) {
        const target = eligible.reduce((max, c) => (c.weight > max.weight ? c : max), eligible[0]);
        target.weight = Math.round((target.weight - 0.5) * 2) / 2;
      } else {
        break;
      }
    }
    currentSum = criteria.reduce((sum, c) => sum + c.weight, 0);
  }

  return criteria;
}

/**
 * Generates an objective marking rubric from question and marks ONLY.
 * Never sees the answer, preventing evaluation bias.
 */
export async function generateRubric(
  question: string,
  totalMarks: number
): Promise<Rubric> {
  const model = getGeminiModel();

  // Target criteria count based on specification
  const targetCount =
    totalMarks === 2 ? 'exactly 2' : totalMarks === 5 ? '4 to 5' : '6 to 8';

  const systemInstruction = `You are a chief university examination controller.
Generate a strict, objective, and fair marking scheme (rubric) for an academic exam question.
CRITICAL RULES:
1. You only know the question and total marks. You NEVER see the student's answer.
2. The total marks is ${totalMarks}.
3. Create ${targetCount} atomic criteria.
4. Each criterion weight must be a multiple of 0.5 (e.g. 0.5, 1.0, 1.5, 2.0).
5. The sum of all weights across all criteria MUST equal exactly ${totalMarks}.
6. Valid criterion types: 'definition', 'concept', 'explanation', 'keyword', 'example', 'diagram'.
7. Set diagram_required to true only if the question explicitly asks for a diagram, architecture, flowchart, or schema.
8. NEVER include scores for the student, student feedback, or grading results.`;

  const prompt = `Academic Question (${totalMarks} Marks):
"${question}"

Generate the official marking rubric for this question.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      diagram_required: {
        type: Type.BOOLEAN,
        description: 'Whether a diagram, schematic, or visual illustration is required by the question prompt.',
      },
      criteria: {
        type: Type.ARRAY,
        description: `List of atomic grading criteria (target: ${targetCount})`,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'Unique ID like crit-1, crit-2' },
            type: {
              type: Type.STRING,
              description: 'One of: definition, concept, explanation, keyword, example, diagram',
            },
            description: {
              type: Type.STRING,
              description: 'Specific expectation for this criterion without ambiguity',
            },
            weight: {
              type: Type.NUMBER,
              description: 'Marks weight (multiple of 0.5, e.g. 0.5, 1.0, 1.5)',
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Essential technical keywords that an examiner expects',
            },
          },
          required: ['id', 'type', 'description', 'weight', 'keywords'],
        },
      },
    },
    required: ['diagram_required', 'criteria'],
  };

  const executeCall = async () => {
    const response = await callGeminiWithRetry({
      preferredModel: model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const parsed = safeParseJson<{
      diagram_required: boolean;
      criteria: RubricCriterion[];
    }>(response.text);

    if (!parsed || !Array.isArray(parsed.criteria) || parsed.criteria.length === 0) {
      throw new Error('Invalid rubric response from Gemini');
    }

    const normalizedCriteria = normalizeRubricWeights(parsed.criteria, totalMarks);

    return {
      total_marks: totalMarks,
      diagram_required: Boolean(parsed.diagram_required),
      criteria: normalizedCriteria,
    };
  };

  try {
    return await executeCall();
  } catch (err) {
    console.warn('First rubric generation attempt failed, retrying once...', err);
    // Retry once
    return await executeCall();
  }
}

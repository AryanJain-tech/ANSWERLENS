import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared server-side Gemini client instance.
 * As per guidelines:
 * - API key is strictly server-side from GEMINI_API_KEY
 * - Telemetry User-Agent header 'aistudio-build' is set
 * - Model defaults to process.env.GEMINI_MODEL || 'gemini-3.8-flash'
 */
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const getGeminiModel = (): string => {
  return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
};

/**
 * Executes a Gemini generateContent call with automatic retry & fallback
 * to handle temporary 503 (high demand) or rate limits.
 */
export async function callGeminiWithRetry(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}): Promise<any> {
  const primaryModel = params.preferredModel || getGeminiModel();
  // Candidate fallback models if primary suffers from temporary 503 high demand spikes
  const fallbackModels = [
    primaryModel,
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;

  for (const model of fallbackModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        const isTransient =
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (isTransient) {
          console.warn(
            `[Gemini Call] Transient error on ${model} (attempt ${attempt}): ${msg}. Retrying in 1.2s...`
          );
          await new Promise((res) => setTimeout(res, 1200));
        } else {
          // Non-transient error, break attempt loop for this model
          break;
        }
      }
    }
  }

  throw lastError || new Error('Gemini API call failed after retries.');
}

import { Type } from '@google/genai';
import { ai, callGeminiWithRetry, getGeminiModel } from './geminiClient.ts';
import { safeParseJson, VisionTranscription } from './validators.ts';

/**
 * Transcribes handwritten student answer using Gemini multimodal vision.
 * Strictly adheres to verbatim transcription without autocorrecting errors.
 */
export async function transcribeHandwriting(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  question: string = ''
): Promise<VisionTranscription> {
  const model = getGeminiModel();

  // Strip possible data URI header
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

  const systemInstruction = `You are an expert handwriting transcription specialist for university exams.
CRITICAL RULES FOR TRANSCRIPTION:
1. VERBATIM ACCURACY: Transcribe the student's handwritten answer EXACTLY as written.
   - DO NOT correct spelling mistakes (e.g. if student wrote "normalisation is proces", keep "normalisation is proces").
   - DO NOT correct grammatical errors, punctuation, or factual inaccuracies.
   - Student errors are an essential part of university marking. Autocorrecting invalidates the exam.
2. UNCERTAIN WORDS: Identify words that are difficult to read, smudged, partially erased, or ambiguous.
3. DIAGRAM DETECTION: Inspect if the student drew any diagrams, tables, flowcharts, schemas, or architectural sketches.
   - set has_diagram: true/false.
   - provide diagram_description: describe what the diagram depicts (labels, boxes, arrows).
4. LEGIBILITY ASSESSMENT:
   - 'good': Clean, easily readable handwriting throughout.
   - 'fair': Readable with moderate effort, some hurried cursive or uneven spacing.
   - 'poor': Heavily smudged, illegible, extremely blurry, or indecipherable.
5. RELEVANCE CHECK:
   - Check if the handwritten text is attempting to answer the stated exam question.
   - Set is_relevant_to_question: false if the page is blank, contains unrelated doodles, recipes, songs, or answers to a completely different subject.`;

  const prompt = question
    ? `Transcribe the handwritten answer on this page for the following exam question:\n"${question}"`
    : `Transcribe the handwritten answer on this page with verbatim accuracy.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      transcript: {
        type: Type.STRING,
        description: 'Verbatim transcription of the student handwritten text. Never autocorrect mistakes.',
      },
      uncertain_words: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Words that were ambiguous, smudged, or difficult to read clearly.',
      },
      has_diagram: {
        type: Type.BOOLEAN,
        description: 'True if a hand-drawn diagram, flowchart, schematic, or structured table is present.',
      },
      diagram_description: {
        type: Type.STRING,
        description: 'Concise description of the drawn diagram and its visual components, or empty string.',
      },
      legibility: {
        type: Type.STRING,
        description: 'One of: good, fair, poor',
      },
      is_relevant_to_question: {
        type: Type.BOOLEAN,
        description: 'Whether the handwritten content attempts to answer the subject of the question.',
      },
    },
    required: [
      'transcript',
      'uncertain_words',
      'has_diagram',
      'diagram_description',
      'legibility',
      'is_relevant_to_question',
    ],
  };

  const imagePart = {
    inlineData: {
      mimeType: mimeType || 'image/jpeg',
      data: cleanBase64,
    },
  };

  const textPart = {
    text: prompt,
  };

  const executeCall = async () => {
    const response = await callGeminiWithRetry({
      preferredModel: model,
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const parsed = safeParseJson<VisionTranscription>(response.text);

    if (!parsed || typeof parsed.transcript !== 'string') {
      throw new Error('Invalid vision transcription response from Gemini');
    }

    const legibilityValue: 'good' | 'fair' | 'poor' =
      parsed.legibility === 'poor' || parsed.legibility === 'fair'
        ? parsed.legibility
        : 'good';

    return {
      transcript: parsed.transcript.trim(),
      uncertain_words: Array.isArray(parsed.uncertain_words) ? parsed.uncertain_words : [],
      has_diagram: Boolean(parsed.has_diagram),
      diagram_description: parsed.diagram_description || '',
      legibility: legibilityValue,
      is_relevant_to_question: parsed.is_relevant_to_question !== false,
    };
  };

  try {
    return await executeCall();
  } catch (err) {
    console.warn('First vision transcription call failed, retrying once...', err);
    return await executeCall();
  }
}

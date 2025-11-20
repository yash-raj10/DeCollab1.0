// OpenAI API utilities for AI-powered text features

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface AIResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Call OpenAI API with a prompt
 */
async function callOpenAI(
  prompt: string,
  systemPrompt: string = "You are a helpful writing assistant.",
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<AIResponse> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return {
        success: false,
        error: error.error?.message || "Failed to generate text",
      };
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content?.trim();

    if (!text) {
      return {
        success: false,
        error: "No text generated",
      };
    }

    return {
      success: true,
      text,
    };
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Rewrite selected text
 */
export async function rewriteText(text: string): Promise<AIResponse> {
  return callOpenAI(
    `Rewrite the following text to make it clearer and more professional while keeping the same meaning:\n\n${text}`,
    "You are a professional editor. Rewrite text to be clear, concise, and professional.",
    0.7,
    1000
  );
}

/**
 * Continue writing from selected text
 */
export async function continueText(text: string): Promise<AIResponse> {
  return callOpenAI(
    `Continue writing from this text naturally and coherently:\n\n${text}`,
    "You are a creative writing assistant. Continue the text in a natural and engaging way.",
    0.8,
    500
  );
}

/**
 * Expand selected text with more details
 */
export async function expandText(text: string): Promise<AIResponse> {
  return callOpenAI(
    `Expand the following text with more details, examples, and explanations:\n\n${text}`,
    "You are a detailed writer. Add relevant details and examples to expand the text.",
    0.7,
    1000
  );
}

/**
 * Summarize selected text
 */
export async function summarizeText(text: string): Promise<AIResponse> {
  return callOpenAI(
    `Summarize the following text concisely:\n\n${text}`,
    "You are a summarization expert. Create clear, concise summaries.",
    0.5,
    300
  );
}

/**
 * Make text shorter
 */
export async function makeShorter(text: string): Promise<AIResponse> {
  return callOpenAI(
    `Make the following text shorter while keeping the key points:\n\n${text}`,
    "You are an editor. Make text concise while preserving important information.",
    0.5,
    500
  );
}

/**
 * Explain text in simpler terms
 */
export async function explainText(text: string): Promise<AIResponse> {
  return callOpenAI(
    `Explain the following text in simpler, easier-to-understand terms:\n\n${text}`,
    "You are a teacher. Explain complex topics in simple, clear language.",
    0.7,
    800
  );
}

/**
 * Translate text to another language
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<AIResponse> {
  return callOpenAI(
    `Translate the following text to ${targetLanguage}:\n\n${text}`,
    `You are a professional translator. Translate text accurately to ${targetLanguage}.`,
    0.3,
    1000
  );
}

/**
 * Generate content from a prompt
 */
export async function generateFromPrompt(prompt: string): Promise<AIResponse> {
  return callOpenAI(
    prompt,
    "You are a helpful writing assistant. Generate high-quality content based on user prompts.",
    0.8,
    1500
  );
}

/**
 * Get AI autocomplete suggestion
 */
export async function getAutocompleteSuggestion(
  context: string,
  currentText: string
): Promise<AIResponse> {
  const prompt = `Given this context:\n${context}\n\nThe user is currently typing: "${currentText}"\n\nComplete this sentence or phrase naturally (provide only the completion, not the full text):`;

  return callOpenAI(
    prompt,
    "You are an autocomplete assistant. Provide natural, contextual text completions.",
    0.7,
    100
  );
}

/**
 * Answer questions about document content
 */
export async function answerQuestion(
  documentContent: string,
  question: string
): Promise<AIResponse> {
  const prompt = `Based on this document:\n\n${documentContent}\n\nAnswer this question: ${question}`;

  return callOpenAI(
    prompt,
    "You are a helpful assistant that answers questions about documents accurately and concisely.",
    0.7,
    500
  );
}

/**
 * Generate a heading for content
 */
export async function generateHeading(text: string): Promise<AIResponse> {
  return callOpenAI(
    `Generate a clear, concise heading for this content:\n\n${text}`,
    "You are a content organizer. Create clear, descriptive headings.",
    0.5,
    50
  );
}

/**
 * Fix grammar and spelling
 */
export async function fixGrammar(text: string): Promise<AIResponse> {
  return callOpenAI(
    `Fix any grammar and spelling errors in this text:\n\n${text}`,
    "You are a grammar expert. Fix errors while preserving the original meaning and style.",
    0.3,
    1000
  );
}

/**
 * Change tone of text
 */
export async function changeTone(
  text: string,
  tone: "professional" | "casual" | "friendly" | "formal"
): Promise<AIResponse> {
  return callOpenAI(
    `Rewrite the following text in a ${tone} tone:\n\n${text}`,
    `You are a writing assistant. Adjust text tone to be ${tone}.`,
    0.7,
    1000
  );
}

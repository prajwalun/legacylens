// OpenAI client wrapper for LLM calls
import OpenAI from 'openai';

// Lazy-load OpenAI client to allow env vars to be set first
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Call GPT-4o-mini with a prompt
 * Using gpt-4o-mini for cost efficiency (10x cheaper than gpt-4)
 */
export async function callGPT4(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  try {
    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are a senior software engineer analyzing code quality issues.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[LLM] Error calling GPT-4:', error);
    throw error;
  }
}

/**
 * Batch version for efficiency - processes prompts in parallel with rate limiting
 * Max 5 concurrent requests to respect API limits
 */
export async function callGPT4Batch(
  prompts: string[],
  systemPrompt?: string
): Promise<string[]> {
  if (prompts.length === 0) {
    return [];
  }

  console.log(`[LLM] Processing ${prompts.length} prompts in batches of 5...`);

  const chunks = chunkArray(prompts, 5);
  const results: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[LLM] Batch ${i + 1}/${chunks.length} (${chunk.length} prompts)...`);

    const chunkResults = await Promise.all(
      chunk.map(prompt => callGPT4(prompt, systemPrompt))
    );

    results.push(...chunkResults);

    // Small delay between batches to respect rate limits
    if (i + 1 < chunks.length) {
      await sleep(1000); // 1 second delay
    }
  }

  console.log(`[LLM] ✓ Completed ${results.length} LLM calls`);

  return results;
}

/**
 * Generate a structured response with JSON parsing
 * Retries once if JSON parsing fails
 */
export async function callGPT4JSON<T>(
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  try {
    const response = await callGPT4(prompt, systemPrompt);

    // Try to parse as JSON
    try {
      return JSON.parse(response) as T;
    } catch (parseError) {
      console.error('[LLM] Failed to parse JSON response, retrying...');

      // Retry once with explicit JSON instruction
      const retryPrompt = prompt + '\n\nIMPORTANT: Respond with ONLY valid JSON, no additional text.';
      const retryResponse = await callGPT4(retryPrompt, systemPrompt);

      return JSON.parse(retryResponse) as T;
    }
  } catch (error) {
    console.error('[LLM] Error in callGPT4JSON:', error);
    throw error;
  }
}

/**
 * Helper function to chunk an array
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test function to verify OpenAI connection
 */
export async function testLLMConnection(): Promise<boolean> {
  try {
    console.log('[LLM] Testing OpenAI connection...');
    const response = await callGPT4('Say "Hello from LegacyLens!" in one sentence.');
    console.log('[LLM] Response:', response);
    return response.length > 0;
  } catch (error) {
    console.error('[LLM] Connection test failed:', error);
    return false;
  }
}


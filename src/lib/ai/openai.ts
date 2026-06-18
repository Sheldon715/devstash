import OpenAI from "openai";

export const AI_MODEL = "mimo-v2-flash";
const MIMO_BASE_URL = "https://api.xiaomimimo.com/v1";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.MIMO_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing MiMo API key. Set MIMO_API_KEY in your environment.");
  }

  cachedClient = new OpenAI({
    apiKey,
    baseURL: MIMO_BASE_URL,
    timeout: 20_000,
  });

  return cachedClient;
}

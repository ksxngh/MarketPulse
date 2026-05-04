import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import type { MarketNews } from "@/lib/finnhub";

export async function generateWelcomeIntro(input: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  if (!env.geminiApiKey) {
    return `Welcome to MarketPulse, ${input.firstName}. Your market dashboard is ready.`;
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: `Write a concise, polished welcome intro for ${input.firstName} ${input.lastName}, who just joined MarketPulse. Mention watchlists, stock research, and daily market context. Keep it under 70 words.`,
  });

  return response.text?.trim() || `Welcome to MarketPulse, ${input.firstName}.`;
}

export async function generateNewsSummary(input: {
  firstName: string;
  symbols: string[];
  articles: MarketNews[];
}) {
  const headlines = input.articles
    .map((article, index) => `${index + 1}. ${article.headline} - ${article.summary}`)
    .join("\n");

  if (!env.geminiApiKey) {
    return `Here are today's key market stories for ${input.firstName}:\n\n${headlines}`;
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: `Create a concise daily stock-market email summary for ${input.firstName}.
Watched symbols: ${input.symbols.join(", ") || "general market"}.
Use these articles:
${headlines}

Return 3-5 bullet points, plain English, no investment advice.`,
  });

  return response.text?.trim() || headlines;
}

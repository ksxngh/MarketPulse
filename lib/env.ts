const optional = (key: string, fallback = "") => process.env[key] ?? fallback;

export const env = {
  appUrl: optional("NEXT_PUBLIC_APP_URL", optional("BETTER_AUTH_URL", "http://localhost:3000")),
  betterAuthUrl: optional("BETTER_AUTH_URL", "http://localhost:3000"),
  betterAuthSecret: optional("BETTER_AUTH_SECRET", "dev-only-change-me-marketpulse-local-secret"),
  mongodbUri: optional("MONGODB_URI", "mongodb://127.0.0.1:27017/marketpulse"),
  finnhubApiKey: optional("FINNHUB_API_KEY"),
  geminiApiKey: optional("GEMINI_API_KEY"),
  geminiModel: optional("GEMINI_MODEL", "gemini-2.5-flash"),
  emailMode: optional("EMAIL_MODE", "preview"),
  smtp: {
    host: optional("SMTP_HOST"),
    port: Number(optional("SMTP_PORT", "587")),
    user: optional("SMTP_USER"),
    pass: optional("SMTP_PASS"),
    from: optional("EMAIL_FROM", "MarketPulse <no-reply@marketpulse.local>"),
  },
};

export function requireEnv(key: keyof typeof env, message: string) {
  const value = env[key];
  if (!value) {
    throw new Error(message);
  }
  return value;
}

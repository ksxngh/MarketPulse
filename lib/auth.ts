import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { env } from "@/lib/env";
import { getMongoDb, getMongoClient } from "@/lib/mongodb";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

function toOrigin(value?: string) {
  if (!value) return "";

  const url = value.startsWith("http") ? value : `https://${value}`;

  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

const trustedOrigins = Array.from(
  new Set(
    [
      env.appUrl,
      env.betterAuthUrl,
      ...env.betterAuthTrustedOrigins.split(","),
      process.env.VERCEL_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ]
      .map(toOrigin)
      .filter(Boolean),
  ),
);

export const auth = betterAuth({
  baseURL: env.betterAuthUrl,
  trustedOrigins,
  secret: env.betterAuthSecret,
  database: isProductionBuild
    ? memoryAdapter({})
    : mongodbAdapter(await getMongoDb(), {
        client: await getMongoClient(),
        transaction: false,
      }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { env } from "@/lib/env";
import { getMongoDb, getMongoClient } from "@/lib/mongodb";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

export const auth = betterAuth({
  baseURL: env.betterAuthUrl,
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

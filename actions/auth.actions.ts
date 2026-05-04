"use server";

import { inngest } from "@/inngest/client";
import { env } from "@/lib/env";

export async function queueUserCreatedEmail(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}) {
  try {
    await inngest.send({
      name: "app/user.created",
      data: user,
    });
  } catch (error) {
    if (env.emailMode !== "preview") throw error;
    console.info("[MarketPulse inngest preview] app/user.created", {
      email: user.email,
      firstName: user.firstName,
    });
  }

  return { ok: true };
}

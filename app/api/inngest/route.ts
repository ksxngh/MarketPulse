import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { checkPriceAlerts, dailyNewsSummary, sendSignUpEmail } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendSignUpEmail, dailyNewsSummary, checkPriceAlerts],
});

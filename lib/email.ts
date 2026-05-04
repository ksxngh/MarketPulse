import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import type { MarketNews } from "@/lib/finnhub";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function shouldPreviewEmail() {
  return env.emailMode === "preview" || !env.smtp.host || !env.smtp.user || !env.smtp.pass;
}

export async function sendEmail(payload: EmailPayload) {
  if (shouldPreviewEmail()) {
    console.info("[MarketPulse email preview]", {
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });

    return { preview: true };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

  return transporter.sendMail({
    from: env.smtp.from,
    ...payload,
  });
}

export async function sendWelcomeEmail(input: {
  to: string;
  firstName: string;
  intro: string;
}) {
  const text = `${input.intro}\n\nStart by searching a symbol, opening its chart page, and adding it to your watchlist.`;

  return sendEmail({
    to: input.to,
    subject: "Welcome to MarketPulse",
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h1>Welcome to MarketPulse, ${input.firstName}</h1>
        <p>${input.intro}</p>
        <p>Start by searching a symbol, opening its chart page, and adding it to your watchlist.</p>
      </div>
    `,
  });
}

export async function sendDailyNewsEmail(input: {
  to: string;
  firstName: string;
  summary: string;
  articles: MarketNews[];
}) {
  const articleLinks = input.articles
    .map((article) => `<li><a href="${article.url}">${article.headline}</a> <span>${article.source}</span></li>`)
    .join("");

  return sendEmail({
    to: input.to,
    subject: "Your MarketPulse daily briefing",
    text: `${input.summary}\n\n${input.articles.map((article) => `${article.headline}: ${article.url}`).join("\n")}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h1>Daily market briefing</h1>
        <p>Hi ${input.firstName},</p>
        <div>${input.summary.replace(/\n/g, "<br />")}</div>
        <h2>Sources</h2>
        <ul>${articleLinks}</ul>
      </div>
    `,
  });
}

export async function sendPriceAlertEmail(input: {
  to: string;
  firstName: string;
  symbol: string;
  company: string;
  direction: "above" | "below";
  targetPrice: number;
  currentPrice: number;
}) {
  const directionLabel = input.direction === "above" ? "rose above" : "fell below";
  const subject = `${input.symbol} ${directionLabel} $${input.targetPrice.toFixed(2)}`;
  const text = `Hi ${input.firstName},\n\n${input.company} (${input.symbol}) ${directionLabel} your target of $${input.targetPrice.toFixed(2)}. Current price: $${input.currentPrice.toFixed(2)}.\n\nThis alert has been marked as fired in MarketPulse.`;

  return sendEmail({
    to: input.to,
    subject,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h1>${input.symbol} price alert</h1>
        <p>Hi ${input.firstName},</p>
        <p>${input.company} (${input.symbol}) ${directionLabel} your target of <strong>$${input.targetPrice.toFixed(2)}</strong>.</p>
        <p>Current price: <strong>$${input.currentPrice.toFixed(2)}</strong></p>
        <p>This alert has been marked as fired in MarketPulse.</p>
      </div>
    `,
  });
}

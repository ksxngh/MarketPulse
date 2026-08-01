"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/actions/user.actions";
import { getStockQuote } from "@/lib/finnhub";
import { sendPriceAlertEmail } from "@/lib/email";
import { Alert, type AlertDirection } from "@/lib/models/alert.model";
import { connectToDatabase } from "@/lib/mongodb";
import { cleanText, normalizeSymbol, rateLimit } from "@/lib/security";

function serializeAlert(alert: {
  _id: unknown;
  symbol: string;
  company: string;
  direction: AlertDirection;
  targetPrice: number;
  lastCheckedPrice?: number;
  status: string;
  firedAt?: Date;
  createdAt?: Date;
}) {
  return {
    id: String(alert._id),
    symbol: alert.symbol,
    company: alert.company,
    direction: alert.direction,
    targetPrice: alert.targetPrice,
    lastCheckedPrice: alert.lastCheckedPrice,
    status: alert.status,
    firedAt: alert.firedAt?.toISOString(),
    createdAt: alert.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function getUserAlerts(symbol?: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  await connectToDatabase();
  const query = {
    userId: user.id,
    ...(symbol ? { symbol: normalizeSymbol(symbol) } : {}),
  };
  const alerts = await Alert.find(query).sort({ createdAt: -1 }).lean();

  return alerts.map(serializeAlert);
}

export async function createPriceAlert(input: {
  symbol: string;
  company: string;
  direction: AlertDirection;
  targetPrice: number;
}) {
  await rateLimit("alert-write", 20);
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to create alerts." };
  }

  const symbol = normalizeSymbol(input.symbol);
  const targetPrice = Number(input.targetPrice);

  if (
    !Number.isFinite(targetPrice) ||
    targetPrice <= 0 ||
    targetPrice > 1_000_000
  ) {
    return { ok: false, message: "Enter a valid target price." };
  }
  if (!["above", "below"].includes(input.direction)) {
    return { ok: false, message: "Choose a valid alert direction." };
  }

  await connectToDatabase();

  let lastCheckedPrice: number | undefined;
  try {
    lastCheckedPrice = (await getStockQuote(symbol)).currentPrice;
  } catch {
    lastCheckedPrice = undefined;
  }

  await Alert.create({
    userId: user.id,
    symbol,
    company: cleanText(input.company, symbol),
    direction: input.direction,
    targetPrice,
    lastCheckedPrice,
    status: "active",
  });

  revalidatePath("/alerts");
  revalidatePath(`/stocks/${symbol}`);

  return { ok: true, message: `Alert created for ${symbol}.` };
}

export async function deletePriceAlert(alertId: string) {
  await rateLimit("alert-write", 20);
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to manage alerts." };
  }

  await connectToDatabase();
  await Alert.deleteOne({ _id: alertId, userId: user.id });

  revalidatePath("/alerts");

  return { ok: true, message: "Alert removed." };
}

export async function reactivatePriceAlert(alertId: string) {
  await rateLimit("alert-write", 20);
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to manage alerts." };
  }

  await connectToDatabase();
  const alert = await Alert.findOneAndUpdate(
    { _id: alertId, userId: user.id },
    { $set: { status: "active" }, $unset: { firedAt: "" } },
    { new: true },
  );

  revalidatePath("/alerts");
  if (alert?.symbol) revalidatePath(`/stocks/${alert.symbol}`);

  return { ok: true, message: "Alert reactivated." };
}

export async function checkUserPriceAlertsNow() {
  await rateLimit("alert-check", 10);
  const user = await getCurrentUser();
  if (!user?.email) {
    return { ok: false, message: "Sign in to check alerts." };
  }

  await connectToDatabase();
  const alerts = await Alert.find({ userId: user.id, status: "active" }).lean();
  let fired = 0;
  let checked = 0;

  for (const alert of alerts) {
    const quote = await getStockQuote(alert.symbol);
    const currentPrice = quote.currentPrice;
    checked += 1;

    const targetReached =
      alert.direction === "above"
        ? currentPrice >= alert.targetPrice
        : currentPrice <= alert.targetPrice;

    await Alert.updateOne(
      { _id: alert._id, userId: user.id },
      { $set: { lastCheckedPrice: currentPrice } },
    );

    if (!targetReached) continue;

    await sendPriceAlertEmail({
      to: user.email,
      firstName: user.name?.split(" ")[0] || "there",
      symbol: alert.symbol,
      company: alert.company,
      direction: alert.direction,
      targetPrice: alert.targetPrice,
      currentPrice,
    });

    await Alert.updateOne(
      { _id: alert._id, userId: user.id },
      {
        $set: {
          status: "fired",
          firedAt: new Date(),
          lastCheckedPrice: currentPrice,
        },
      },
    );

    fired += 1;
  }

  revalidatePath("/alerts");

  return {
    ok: true,
    message:
      fired > 0
        ? `Checked ${checked} alert(s). Sent ${fired} email(s).`
        : `Checked ${checked} alert(s). No targets crossed yet.`,
  };
}

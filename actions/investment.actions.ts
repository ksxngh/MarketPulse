"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/actions/user.actions";
import { getStockQuote } from "@/lib/finnhub";
import { Investment } from "@/lib/models/investment.model";
import { connectToDatabase } from "@/lib/mongodb";
import { cleanText, normalizeSymbol, rateLimit } from "@/lib/security";

type InvestmentRecord = {
  _id: unknown;
  symbol: string;
  company: string;
  shares: number;
  averageBuyPrice: number;
  boughtAt?: Date;
  createdAt?: Date;
};

function serializeInvestment(item: InvestmentRecord) {
  return {
    id: String(item._id),
    symbol: item.symbol,
    company: item.company,
    shares: item.shares,
    averageBuyPrice: item.averageBuyPrice,
    boughtAt: item.boughtAt?.toISOString() ?? new Date().toISOString(),
    createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function getOwnedInvestment(symbol: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectToDatabase();
  const investment = await Investment.findOne({
    userId: user.id,
    symbol: normalizeSymbol(symbol),
  }).lean<InvestmentRecord>();

  return investment ? serializeInvestment(investment) : null;
}

export async function getUserInvestments() {
  const user = await getCurrentUser();
  if (!user) return [];

  await connectToDatabase();
  const items = await Investment.find({ userId: user.id })
    .sort({ boughtAt: -1 })
    .lean<InvestmentRecord[]>();

  return items.map(serializeInvestment);
}

export async function getUserInvestmentsWithQuotes() {
  const investments = await getUserInvestments();

  return Promise.all(
    investments.map(async (investment) => {
      try {
        const quote = await getStockQuote(investment.symbol);
        const invested = investment.shares * investment.averageBuyPrice;
        const currentValue = investment.shares * quote.currentPrice;
        const profitLoss = currentValue - invested;
        const profitLossPercent = invested ? (profitLoss / invested) * 100 : 0;

        return {
          ...investment,
          quote,
          invested,
          currentValue,
          profitLoss,
          profitLossPercent,
        };
      } catch {
        return {
          ...investment,
          quote: null,
          invested: investment.shares * investment.averageBuyPrice,
          currentValue: 0,
          profitLoss: 0,
          profitLossPercent: 0,
        };
      }
    }),
  );
}

export async function getInvestmentDetail(symbol: string) {
  const investment = await getOwnedInvestment(symbol);
  if (!investment) return null;

  try {
    const quote = await getStockQuote(investment.symbol);
    const invested = investment.shares * investment.averageBuyPrice;
    const currentValue = investment.shares * quote.currentPrice;
    const profitLoss = currentValue - invested;
    const profitLossPercent = invested ? (profitLoss / invested) * 100 : 0;

    return {
      ...investment,
      quote,
      invested,
      currentValue,
      profitLoss,
      profitLossPercent,
    };
  } catch {
    return {
      ...investment,
      quote: null,
      invested: investment.shares * investment.averageBuyPrice,
      currentValue: 0,
      profitLoss: 0,
      profitLossPercent: 0,
    };
  }
}

export async function addInvestment(input: {
  symbol: string;
  company?: string;
  shares?: number;
  averageBuyPrice?: number;
  amountInvested?: number;
  boughtAt?: string;
}) {
  await rateLimit("investment-write", 20);
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to manage investments." };
  }

  const symbol = normalizeSymbol(input.symbol);
  const amountInvested = Number(input.amountInvested);
  let shares = Number(input.shares);
  let averageBuyPrice = Number(input.averageBuyPrice);
  const boughtAt = input.boughtAt ? new Date(input.boughtAt) : new Date();

  if (Number.isFinite(amountInvested) && amountInvested > 0) {
    if (amountInvested > 100_000_000) {
      return { ok: false, message: "Enter a smaller investment amount." };
    }

    try {
      const quote = await getStockQuote(symbol);
      if (!quote.currentPrice || quote.currentPrice <= 0) {
        return { ok: false, message: "No live price available for that stock." };
      }
      averageBuyPrice = quote.currentPrice;
      shares = amountInvested / quote.currentPrice;
    } catch {
      return {
        ok: false,
        message: "Could not fetch a live price for that stock.",
      };
    }
  } else {
    if (!Number.isFinite(shares) || shares <= 0 || shares > 1_000_000) {
      return { ok: false, message: "Enter a valid share quantity." };
    }
    if (
      !Number.isFinite(averageBuyPrice) ||
      averageBuyPrice <= 0 ||
      averageBuyPrice > 1_000_000
    ) {
      return { ok: false, message: "Enter a valid buy price." };
    }
  }
  if (Number.isNaN(boughtAt.getTime()) || boughtAt > new Date()) {
    return { ok: false, message: "Choose a valid buy date." };
  }

  await connectToDatabase();
  await Investment.updateOne(
    { userId: user.id, symbol },
    {
      $set: {
        userId: user.id,
        symbol,
        company: cleanText(input.company || symbol, symbol),
        shares,
        averageBuyPrice,
        boughtAt,
      },
    },
    { upsert: true },
  );

  revalidatePath("/");
  revalidatePath("/investments");
  revalidatePath(`/investments/${symbol}`);

  return { ok: true, message: `${symbol} investment saved.` };
}

export async function deleteInvestment(symbol: string) {
  await rateLimit("investment-write", 20);
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to manage investments." };
  }

  const normalizedSymbol = normalizeSymbol(symbol);

  await connectToDatabase();
  await Investment.deleteOne({ userId: user.id, symbol: normalizedSymbol });

  revalidatePath("/");
  revalidatePath("/investments");
  revalidatePath(`/investments/${normalizedSymbol}`);

  return { ok: true, message: `${normalizedSymbol} removed.` };
}

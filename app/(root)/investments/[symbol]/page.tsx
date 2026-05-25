import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  LineChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getInvestmentDetail } from "@/actions/investment.actions";
import TradingViewWidget from "@/components/stocks/TradingViewWidget";
import DeleteInvestmentButton from "@/components/investments/DeleteInvestmentButton";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
  }).format(value || 0);
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export default async function InvestmentDetailPage({ params }: PageProps) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol || "").toUpperCase();
  if (!symbol || symbol.length > 16) notFound();

  const investment = await getInvestmentDetail(symbol);
  if (!investment) notFound();

  const isUp = investment.profitLoss >= 0;
  const boughtAt = new Date(investment.boughtAt);

  return (
    <div className="space-y-6">
      <Link
        href="/investments"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-yellow-400"
      >
        <ArrowLeft className="size-4" />
        Investments
      </Link>

      <section className="terminal-panel p-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_220px] xl:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-lg border border-gray-700 bg-black text-xl font-semibold text-yellow-400">
              {investment.symbol.slice(0, 2)}
            </div>
            <div>
              <p className="terminal-title">Investment Details</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-100">
                {investment.symbol}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {investment.company}
              </p>
            </div>
          </div>
          <DeleteInvestmentButton symbol={investment.symbol} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            {
              label: "Current Value",
              value: investment.quote
                ? formatMoney(investment.currentValue)
                : "Waiting",
              icon: DollarSign,
              tone: "text-yellow-400",
            },
            {
              label: "Profit / Loss",
              value: investment.quote
                ? formatMoney(investment.profitLoss)
                : "Waiting",
              icon: isUp ? TrendingUp : TrendingDown,
              tone: isUp ? "text-teal-400" : "text-red-500",
            },
            {
              label: "Return",
              value: investment.quote
                ? formatPercent(investment.profitLossPercent)
                : "Waiting",
              icon: LineChart,
              tone: isUp ? "text-teal-400" : "text-red-500",
            },
            {
              label: "Bought",
              value: boughtAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              icon: Calendar,
              tone: "text-blue-600",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-gray-700 bg-black/50 p-4"
            >
              <metric.icon className={`size-5 ${metric.tone}`} />
              <p className="mt-4 text-lg font-semibold text-gray-100">
                {metric.value}
              </p>
              <p className="text-xs text-gray-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <TradingViewWidget
            symbol={investment.symbol}
            type="symbol-info"
            height={180}
          />
          <TradingViewWidget
            symbol={investment.symbol}
            type="advanced-chart"
            height={620}
          />
        </div>
        <aside className="terminal-panel p-5">
          <h2 className="text-lg font-semibold text-gray-100">
            Position breakdown
          </h2>
          <div className="mt-5 space-y-4 text-sm">
            {[
              ["Shares", investment.shares],
              ["Average buy", formatMoney(investment.averageBuyPrice)],
              ["Invested", formatMoney(investment.invested)],
              [
                "Current price",
                investment.quote
                  ? formatMoney(investment.quote.currentPrice)
                  : "Waiting",
              ],
              [
                "Day change",
                investment.quote
                  ? formatPercent(investment.quote.percentChange)
                  : "Waiting",
              ],
              [
                "Unrealized gain",
                investment.quote
                  ? formatMoney(investment.profitLoss)
                  : "Waiting",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-gray-700 pb-3 last:border-b-0"
              >
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-200">{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

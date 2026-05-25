import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getUserInvestmentsWithQuotes } from "@/actions/investment.actions";
import InvestmentForm from "@/components/investments/InvestmentForm";
import DeleteInvestmentButton from "@/components/investments/DeleteInvestmentButton";

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

export default async function InvestmentsPage() {
  const investments = await getUserInvestmentsWithQuotes();
  const totals = investments.reduce(
    (sum, item) => ({
      invested: sum.invested + item.invested,
      currentValue: sum.currentValue + item.currentValue,
      profitLoss: sum.profitLoss + item.profitLoss,
    }),
    { invested: 0, currentValue: 0, profitLoss: 0 },
  );
  const totalPercent = totals.invested
    ? (totals.profitLoss / totals.invested) * 100
    : 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1fr_520px]">
        <div>
          <p className="terminal-title">Investments</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-100">
            Portfolio tracker
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Add what you bought in your real brokerage apps and track live
            position value with Finnhub quotes.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Invested",
              value: formatMoney(totals.invested),
              icon: DollarSign,
              tone: "text-yellow-400",
            },
            {
              label: "Value",
              value: formatMoney(totals.currentValue),
              icon: BriefcaseBusiness,
              tone: "text-blue-600",
            },
            {
              label: "P/L",
              value: formatMoney(totals.profitLoss),
              icon: totals.profitLoss >= 0 ? TrendingUp : TrendingDown,
              tone: totals.profitLoss >= 0 ? "text-teal-400" : "text-red-500",
            },
          ].map((metric) => (
            <div key={metric.label} className="terminal-panel p-4">
              <metric.icon className={`size-5 ${metric.tone}`} />
              <p className="mt-4 text-lg font-semibold text-gray-100">
                {metric.value}
              </p>
              <p className="text-xs text-gray-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <InvestmentForm />

      <section className="terminal-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-100">
            Your positions
          </h2>
          <span
            className={
              totalPercent >= 0
                ? "text-sm font-semibold text-teal-400"
                : "text-sm font-semibold text-red-500"
            }
          >
            {formatPercent(totalPercent)} overall
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-y border-gray-700 bg-black/50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  "Stock",
                  "Shares",
                  "Buy price",
                  "Current",
                  "Invested",
                  "Value",
                  "Profit/Loss",
                  "",
                ].map((head) => (
                  <th key={head} className="px-5 py-3 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.map((item) => {
                const isUp = item.profitLoss >= 0;

                return (
                  <tr key={item.symbol} className="border-b border-gray-700/70">
                    <td className="px-5 py-4">
                      <Link
                        href={`/investments/${item.symbol}`}
                        className="group"
                      >
                        <p className="flex items-center gap-2 font-semibold text-gray-100 group-hover:text-yellow-400">
                          {item.symbol}
                          <ArrowRight className="size-4 text-gray-500 group-hover:text-yellow-400" />
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {item.company}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-gray-300">{item.shares}</td>
                    <td className="px-5 py-4 text-gray-300">
                      {formatMoney(item.averageBuyPrice)}
                    </td>
                    <td className="px-5 py-4 text-gray-300">
                      {item.quote
                        ? formatMoney(item.quote.currentPrice)
                        : "Waiting"}
                    </td>
                    <td className="px-5 py-4 text-gray-300">
                      {formatMoney(item.invested)}
                    </td>
                    <td className="px-5 py-4 text-gray-300">
                      {item.quote ? formatMoney(item.currentValue) : "Waiting"}
                    </td>
                    <td
                      className={
                        isUp
                          ? "px-5 py-4 font-semibold text-teal-400"
                          : "px-5 py-4 font-semibold text-red-500"
                      }
                    >
                      {item.quote
                        ? `${formatMoney(item.profitLoss)} (${formatPercent(item.profitLossPercent)})`
                        : "Waiting"}
                    </td>
                    <td className="px-5 py-4">
                      <DeleteInvestmentButton symbol={item.symbol} />
                    </td>
                  </tr>
                );
              })}
              {investments.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-gray-500" colSpan={8}>
                    Add your first position above.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

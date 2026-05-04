import { notFound } from "next/navigation";
import TradingViewWidget from "@/components/stocks/TradingViewWidget";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import { isInWatchlist } from "@/actions/watchlist.actions";
import AlertForm from "@/components/alerts/AlertForm";
import AlertList from "@/components/alerts/AlertList";
import { getUserAlerts } from "@/actions/alert.actions";
import { Activity, BarChart3, Building2, DollarSign, LineChart, ShieldCheck } from "lucide-react";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function StockDetailPage({ params }: PageProps) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol || "").toUpperCase();

  if (!symbol || symbol.length > 16) notFound();

  const [inWatchlist, alerts] = await Promise.all([
    isInWatchlist(symbol),
    getUserAlerts(symbol),
  ]);

  return (
    <div className="space-y-6">
      <section className="terminal-panel p-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_280px] xl:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-lg border border-gray-700 bg-black text-xl font-semibold text-yellow-400">
              {symbol.slice(0, 2)}
            </div>
            <div>
              <p className="terminal-title">Stock Details</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-100">{symbol}</h1>
              <p className="mt-2 text-sm text-gray-500">Nasdaq stock market · Real-time widgets</p>
            </div>
          </div>
          <WatchlistButton symbol={symbol} company={symbol} initialInWatchlist={inWatchlist} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            { label: "Price Feed", value: "TradingView", icon: LineChart, tone: "text-teal-400" },
            { label: "Alerts", value: alerts.length, icon: ShieldCheck, tone: "text-yellow-400" },
            { label: "Financials", value: "Live", icon: DollarSign, tone: "text-blue-600" },
            { label: "Analysis", value: "Technical", icon: Activity, tone: "text-purple-500" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-700 bg-black/50 p-4">
              <item.icon className={`size-5 ${item.tone}`} />
              <p className="mt-4 text-lg font-semibold text-gray-100">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <TradingViewWidget symbol={symbol} type="symbol-info" height={180} />
          <TradingViewWidget symbol={symbol} type="advanced-chart" height={620} />
        </div>
        <aside className="space-y-6">
          <AlertForm symbol={symbol} company={symbol} />
          <div className="terminal-panel p-5">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-gray-100">Overview</h2>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              {[
                ["Today's Range", "TradingView feed"],
                ["Market Cap", "Live widget"],
                ["P/E Ratio", "Financials"],
                ["Previous Close", "Quote panel"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-gray-700 pb-3 last:border-b-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="terminal-panel p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5 text-teal-400" />
              <h2 className="text-lg font-semibold text-gray-100">{symbol} alerts</h2>
            </div>
            <div className="mt-4">
              <AlertList alerts={alerts} />
            </div>
          </div>
        </aside>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <TradingViewWidget symbol={symbol} type="technical-analysis" height={420} />
        <TradingViewWidget symbol={symbol} type="company-profile" height={420} />
        <TradingViewWidget symbol={symbol} type="financials" height={420} />
      </div>
    </div>
  );
}

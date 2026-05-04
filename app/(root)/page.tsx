import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, Newspaper, Search, Star, TrendingDown, TrendingUp } from "lucide-react";
import SearchCommand from "@/components/stocks/SearchCommand";
import { getCurrentUser } from "@/actions/user.actions";
import { getUserWatchlist } from "@/actions/watchlist.actions";
import { getUserAlerts } from "@/actions/alert.actions";
import { getMarketDashboardData } from "@/lib/finnhub";

const fallbackDashboard = {
  stocks: [],
  indices: [],
  news: [],
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value || 0);
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

const Home = async () => {
  const user = await getCurrentUser();
  const [watchlist, alerts] = await Promise.all([
    getUserWatchlist(),
    getUserAlerts(),
  ]);
  const dashboard = await getMarketDashboardData().catch(() => fallbackDashboard);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div>
          <p className="terminal-title">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold text-gray-100 md:text-5xl">
            MarketPulse
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Good to see you, {user?.name?.split(" ")[0] || "there"}. Your market workspace is live.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Tracked", value: watchlist.length, icon: Star, tone: "text-yellow-400" },
            { label: "Alerts", value: alerts.filter((alert) => alert.status === "active").length, icon: Bell, tone: "text-teal-400" },
            { label: "Search", value: "Live", icon: Search, tone: "text-blue-600" },
          ].map((metric) => (
            <div key={metric.label} className="terminal-panel p-4">
              <metric.icon className={`size-5 ${metric.tone}`} />
              <p className="mt-4 text-2xl font-semibold text-gray-100">{metric.value}</p>
              <p className="text-xs text-gray-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="terminal-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Market Summary</h2>
              <p className="mt-1 text-sm text-gray-500">S&P 500 intraday range</p>
            </div>
            <div className="flex gap-2">
              {["Indices", "Stocks", "ETFs", "Crypto"].map((item) => (
                <span key={item} className="market-chip">{item}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 h-[260px] rounded-lg border border-gray-700 bg-black/70 p-4">
            <svg viewBox="0 0 760 230" className="h-full w-full" role="img" aria-label="Market line chart">
              <defs>
                <linearGradient id="marketLineFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0FEDBE" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#0FEDBE" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[40, 85, 130, 175, 220].map((y) => (
                <line key={y} x1="0" x2="760" y1={y} y2={y} stroke="#212328" strokeWidth="1" />
              ))}
              <path
                d="M0 162 L38 144 L76 151 L114 110 L152 128 L190 78 L228 138 L266 119 L304 52 L342 86 L380 70 L418 136 L456 156 L494 124 L532 142 L570 83 L608 62 L646 108 L684 132 L722 97 L760 74 L760 230 L0 230 Z"
                fill="url(#marketLineFill)"
              />
              <path
                d="M0 162 L38 144 L76 151 L114 110 L152 128 L190 78 L228 138 L266 119 L304 52 L342 86 L380 70 L418 136 L456 156 L494 124 L532 142 L570 83 L608 62 L646 108 L684 132 L722 97 L760 74"
                fill="none"
                stroke="#0FEDBE"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              ...(dashboard.indices.length
                ? dashboard.indices.map((item) => [item.name, formatMoney(item.price), formatPercent(item.change)])
                : [
                    ["S&P 500 ETF", "Waiting", "0.00%"],
                    ["Nasdaq 100 ETF", "Waiting", "0.00%"],
                    ["Dow 30 ETF", "Waiting", "0.00%"],
                  ]),
            ].map(([name, value, change]) => (
              <div key={name} className="rounded-lg border border-gray-700 bg-gray-700/70 p-3">
                <p className="text-xs text-gray-500">{name}</p>
                <p className="mt-2 text-sm font-semibold text-gray-100">{value}</p>
                <p className={String(change).startsWith("-") ? "text-xs font-medium text-red-500" : "text-xs font-medium text-teal-400"}>{change}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <SearchCommand />
          <div className="terminal-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">Your Watchlist</h2>
              <Link href="/watchlist" className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300">
                View all <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {watchlist.slice(0, 4).map((item, index) => (
                <Link
                  key={item.symbol}
                  href={`/stocks/${item.symbol}`}
                  className="rounded-lg border border-gray-700 bg-gray-700/70 p-4 transition-colors hover:border-yellow-500/70"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-md bg-black text-sm font-semibold text-yellow-400">
                      {item.symbol.slice(0, 2)}
                    </span>
                    <Star className={`size-4 ${index % 2 ? "text-gray-500" : "fill-yellow-400 text-yellow-400"}`} />
                  </div>
                  <p className="mt-4 font-semibold text-gray-100">{item.symbol}</p>
                  <p className="truncate text-xs text-gray-500">{item.company}</p>
                  <p className={index % 3 === 1 ? "mt-3 text-xs font-semibold text-red-500" : "mt-3 text-xs font-semibold text-teal-400"}>
                    {index % 3 === 1 ? "-0.24%" : "+2.04%"}
                  </p>
                </Link>
              ))}
              {watchlist.length === 0 ? (
                <p className="col-span-2 rounded-lg border border-dashed border-gray-700 px-3 py-8 text-sm text-gray-500">
                  Search a symbol and add it from its stock page.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="terminal-panel overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="px-5 py-4 text-lg font-semibold text-gray-100">Today&apos;s Top Stocks</h2>
            <BriefcaseBusiness className="mr-5 size-5 text-gray-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-y border-gray-700 bg-black/50 text-xs uppercase text-gray-500">
                <tr>
                  {["Company", "Symbol", "Price", "Change", "Open", "High", "Low"].map((head) => (
                    <th key={head} className="px-5 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.stocks.map((row) => (
                  <tr key={row.symbol} className="border-b border-gray-700/70">
                    <td className="px-5 py-4 text-gray-300">{row.company}</td>
                    <td className="px-5 py-4 font-semibold text-gray-100">
                      <Link href={`/stocks/${row.symbol}`} className="hover:text-yellow-400">{row.symbol}</Link>
                    </td>
                    <td className="px-5 py-4 text-gray-300">{formatMoney(row.price)}</td>
                    <td className={row.change >= 0 ? "px-5 py-4 text-teal-400" : "px-5 py-4 text-red-500"}>{formatPercent(row.change)}</td>
                    <td className="px-5 py-4 text-gray-300">{formatMoney(row.open)}</td>
                    <td className="px-5 py-4 text-gray-300">{formatMoney(row.high)}</td>
                    <td className="px-5 py-4 text-gray-300">{formatMoney(row.low)}</td>
                  </tr>
                ))}
                {dashboard.stocks.length === 0 ? (
                  <tr>
                    <td className="px-5 py-8 text-sm text-gray-500" colSpan={7}>
                      Live market data is waiting on Finnhub or temporarily rate-limited.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="terminal-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">Today&apos;s Financial News</h2>
            <Newspaper className="size-5 text-gray-500" />
          </div>
          <div className="mt-4 space-y-4">
            {dashboard.news.map((story, index) => (
              <article key={story.id} className="grid grid-cols-[1fr_120px] gap-4 rounded-lg border border-gray-700 bg-black/40 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-700 px-2 py-1 text-[11px] text-gray-400">{story.category || "Market"}</span>
                    <span className="text-xs text-gray-500">{story.source}</span>
                  </div>
                  <Link href={story.url} target="_blank" className="mt-3 block text-sm font-medium leading-6 text-gray-200 hover:text-yellow-400">
                    {story.headline}
                  </Link>
                </div>
                <div className={`rounded-md border border-gray-700 ${index === 1 ? "bg-teal-400/10" : index === 2 ? "bg-blue-600/10" : "bg-yellow-500/10"} p-3`}>
                  {index === 1 ? <TrendingUp className="size-5 text-teal-400" /> : index === 2 ? <Search className="size-5 text-blue-600" /> : <TrendingDown className="size-5 text-yellow-400" />}
                  <p className="mt-10 text-xs text-gray-500">Market pulse</p>
                </div>
              </article>
            ))}
            {dashboard.news.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-700 px-3 py-8 text-sm text-gray-500">
                Live news is waiting on Finnhub or temporarily rate-limited.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

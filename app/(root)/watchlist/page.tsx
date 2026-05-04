import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getUserWatchlist } from "@/actions/watchlist.actions";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import SearchCommand from "@/components/stocks/SearchCommand";

export default async function WatchlistPage() {
  const watchlist = await getUserWatchlist();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-yellow-400">Watchlist</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-100">Tracked symbols</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          These symbols are stored in MongoDB per user and feed the daily news summary workflow.
        </p>
      </section>

      <SearchCommand />

      <section className="grid gap-4">
        {watchlist.map((item) => (
          <div key={item.symbol} className="grid gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4 md:grid-cols-[1fr_220px_180px] md:items-center">
            <Link href={`/stocks/${item.symbol}`} className="group">
              <p className="flex items-center gap-2 text-xl font-semibold text-gray-100">
                {item.symbol}
                <ArrowRight className="size-4 text-gray-500 transition-colors group-hover:text-yellow-400" />
              </p>
              <p className="mt-1 text-sm text-gray-500">{item.company}</p>
            </Link>
            <p className="text-sm text-gray-500">
              Added {new Date(item.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <WatchlistButton symbol={item.symbol} company={item.company} initialInWatchlist />
          </div>
        ))}

        {watchlist.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 bg-gray-800 px-4 py-10 text-center">
            <p className="font-medium text-gray-300">No symbols yet</p>
            <p className="mt-2 text-sm text-gray-500">Search above, open a stock page, and add it to your watchlist.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

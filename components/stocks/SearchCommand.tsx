"use client";

import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { searchStocks } from "@/actions/finnhub.actions";
import type { FinnhubSearchResult } from "@/lib/finnhub";

export default function SearchCommand() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FinnhubSearchResult[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([]);
        setError("");
        return;
      }

      startTransition(async () => {
        try {
          setResults(await searchStocks(query));
          setError("");
        } catch (searchError) {
          setError(searchError instanceof Error ? searchError.message : "Search failed.");
        }
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="terminal-panel-dark w-full overflow-hidden">
      <div className="flex h-14 items-center gap-3 border-b border-gray-700 px-4">
        <Search className="size-5 text-yellow-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-full flex-1 bg-transparent text-base text-gray-100 outline-none placeholder:text-gray-500"
          placeholder="Search stocks by symbol or company"
        />
        {isPending ? <Loader2 className="size-4 animate-spin text-gray-500" /> : null}
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {error ? <p className="px-3 py-6 text-sm text-red-300">{error}</p> : null}
        {!error && query.length >= 2 && results.length === 0 && !isPending ? (
          <p className="px-3 py-6 text-sm text-gray-500">No matching symbols found.</p>
        ) : null}
        {results.map((result) => (
          <Link
            key={`${result.symbol}-${result.description}`}
            href={`/stocks/${encodeURIComponent(result.symbol)}`}
            className="flex items-center justify-between rounded-md border border-transparent px-3 py-3 transition-colors hover:border-gray-700 hover:bg-gray-800"
          >
            <div>
              <p className="font-semibold text-gray-100">{result.symbol}</p>
              <p className="text-sm text-gray-500">{result.description}</p>
            </div>
            <span className="rounded bg-gray-700 px-2 py-1 text-xs uppercase text-gray-400">{result.type}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

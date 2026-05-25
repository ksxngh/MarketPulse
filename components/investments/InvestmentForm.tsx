"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Search, TrendingUp } from "lucide-react";
import { addInvestment } from "@/actions/investment.actions";
import { getLiveStockQuote, searchStocks } from "@/actions/finnhub.actions";
import { Button } from "@/components/ui/button";
import type { FinnhubSearchResult, StockQuote } from "@/lib/finnhub";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value || 0);
}

function formatShares(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value || 0);
}

export default function InvestmentForm() {
  const [symbol, setSymbol] = useState("");
  const [company, setCompany] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [amountInvested, setAmountInvested] = useState("");
  const [results, setResults] = useState<FinnhubSearchResult[]>([]);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [message, setMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();
  const [isQuotePending, startQuoteTransition] = useTransition();

  const investmentAmount = Number(amountInvested);
  const estimatedShares = useMemo(() => {
    if (!quote?.currentPrice || !Number.isFinite(investmentAmount)) return 0;
    return investmentAmount / quote.currentPrice;
  }, [investmentAmount, quote]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeQuery.trim().length < 2) {
        setResults([]);
        setSearchError("");
        return;
      }

      startSearchTransition(async () => {
        try {
          setResults(await searchStocks(activeQuery));
          setSearchError("");
        } catch (error) {
          setSearchError(
            error instanceof Error ? error.message : "Search failed.",
          );
        }
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [activeQuery]);

  function selectResult(result: FinnhubSearchResult) {
    setSymbol(result.symbol);
    setCompany(result.description);
    setActiveQuery("");
    setResults([]);
    setMessage("");

    startQuoteTransition(async () => {
      try {
        setQuote(await getLiveStockQuote(result.symbol));
      } catch (error) {
        setQuote(null);
        setMessage(
          error instanceof Error ? error.message : "Could not fetch price.",
        );
      }
    });
  }

  function handleSubmit(formData: FormData) {
    setMessage("");

    startTransition(async () => {
      const result = await addInvestment({
        symbol: String(formData.get("symbol") || ""),
        company: String(formData.get("company") || ""),
        amountInvested: Number(formData.get("amountInvested")),
        boughtAt: String(formData.get("boughtAt") || ""),
      });

      setMessage(result.message);
    });
  }

  return (
    <form action={handleSubmit} className="terminal-panel p-5">
      <div className="flex items-center gap-2">
        <Plus className="size-5 text-yellow-400" />
        <h2 className="text-lg font-semibold text-gray-100">
          Add investment
        </h2>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2">
          <span className="form-label">Symbol</span>
          <input
            name="symbol"
            value={symbol}
            onChange={(event) => {
              const value = event.target.value.toUpperCase();
              setSymbol(value);
              setActiveQuery(value);
              setQuote(null);
            }}
            className="form-input w-full uppercase"
            placeholder="AAPL"
            maxLength={16}
            required
          />
        </label>
        <label className="space-y-2 xl:col-span-2">
          <span className="form-label">Stock name</span>
          <input
            name="company"
            value={company}
            onChange={(event) => {
              const value = event.target.value;
              setCompany(value);
              setActiveQuery(value);
              setQuote(null);
            }}
            className="form-input w-full"
            placeholder="Apple Inc"
            maxLength={120}
            required
          />
        </label>
        <label className="space-y-2">
          <span className="form-label">Money spent</span>
          <input
            name="amountInvested"
            value={amountInvested}
            onChange={(event) => setAmountInvested(event.target.value)}
            className="form-input w-full"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="500.00"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="form-label">Buy date</span>
          <input name="boughtAt" className="form-input w-full" type="date" />
        </label>
      </div>

      {(results.length > 0 || isSearching || searchError) && (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-700 bg-black/70">
          <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-3 text-sm text-gray-500">
            {isSearching ? (
              <Loader2 className="size-4 animate-spin text-gray-500" />
            ) : (
              <Search className="size-4 text-yellow-400" />
            )}
            Select a stock to fill symbol and name
          </div>
          {searchError ? (
            <p className="px-4 py-4 text-sm text-red-300">{searchError}</p>
          ) : null}
          {results.map((result) => (
            <button
              type="button"
              key={`${result.symbol}-${result.description}`}
              onClick={() => selectResult(result)}
              className="grid w-full gap-2 border-b border-gray-700 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-800 md:grid-cols-[140px_1fr_90px]"
            >
              <span className="font-semibold text-gray-100">
                {result.symbol}
              </span>
              <span className="text-sm text-gray-500">
                {result.description}
              </span>
              <span className="text-xs uppercase text-gray-500">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_220px]">
        <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-teal-400" />
            <p className="text-sm font-medium text-gray-300">Live price</p>
          </div>
          <p className="mt-3 text-xl font-semibold text-gray-100">
            {isQuotePending ? (
              <Loader2 className="size-5 animate-spin text-gray-500" />
            ) : quote ? (
              formatMoney(quote.currentPrice)
            ) : (
              "Select a stock"
            )}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
          <p className="text-sm font-medium text-gray-300">
            Estimated shares
          </p>
          <p className="mt-3 text-xl font-semibold text-gray-100">
            {quote && investmentAmount > 0
              ? formatShares(estimatedShares)
              : "0"}
          </p>
        </div>
        <Button className="yellow-btn h-full w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Save investment
        </Button>
      </div>

      {message ? <p className="mt-3 text-sm text-gray-500">{message}</p> : null}
    </form>
  );
}

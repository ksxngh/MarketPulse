"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { addInvestment } from "@/actions/investment.actions";
import { Button } from "@/components/ui/button";

export default function InvestmentForm() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");

    startTransition(async () => {
      const result = await addInvestment({
        symbol: String(formData.get("symbol") || ""),
        company: String(formData.get("company") || ""),
        shares: Number(formData.get("shares")),
        averageBuyPrice: Number(formData.get("averageBuyPrice")),
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
            className="form-input w-full"
            placeholder="Apple Inc"
            maxLength={120}
          />
        </label>
        <label className="space-y-2">
          <span className="form-label">Shares bought</span>
          <input
            name="shares"
            className="form-input w-full"
            type="number"
            min="0.000001"
            step="0.000001"
            placeholder="10"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="form-label">Buy price</span>
          <input
            name="averageBuyPrice"
            className="form-input w-full"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="185.00"
            required
          />
        </label>
        <label className="space-y-2 md:col-span-2 xl:col-span-2">
          <span className="form-label">Buy date</span>
          <input name="boughtAt" className="form-input w-full" type="date" />
        </label>
        <Button
          className="yellow-btn md:col-span-2 xl:col-span-3 xl:self-end"
          disabled={isPending}
        >
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

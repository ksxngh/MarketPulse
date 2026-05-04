"use client";

import { useState, useTransition } from "react";
import { Bell, Loader2 } from "lucide-react";
import { createPriceAlert } from "@/actions/alert.actions";
import type { AlertDirection } from "@/lib/models/alert.model";
import { Button } from "@/components/ui/button";

export default function AlertForm({
  symbol,
  company,
}: {
  symbol: string;
  company: string;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");

    startTransition(async () => {
      const result = await createPriceAlert({
        symbol,
        company,
        direction: String(formData.get("direction")) as AlertDirection,
        targetPrice: Number(formData.get("targetPrice")),
      });

      setMessage(result.message);
    });
  }

  return (
    <form action={handleSubmit} className="rounded-lg border border-gray-700 bg-gray-800 p-5">
      <div className="flex items-center gap-2">
        <Bell className="size-5 text-yellow-400" />
        <h2 className="text-lg font-semibold text-gray-100">Price alert</h2>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[130px_1fr]">
        <label className="space-y-2">
          <span className="form-label">Condition</span>
          <select name="direction" className="form-input w-full" defaultValue="above">
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="form-label">Target price</span>
          <input
            name="targetPrice"
            className="form-input w-full"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="185.00"
            required
          />
        </label>
      </div>

      <Button className="yellow-btn mt-4 w-full" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        Create alert
      </Button>

      {message ? <p className="mt-3 text-sm text-gray-500">{message}</p> : null}
    </form>
  );
}

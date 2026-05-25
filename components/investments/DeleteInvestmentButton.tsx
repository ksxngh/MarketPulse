"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteInvestment } from "@/actions/investment.actions";
import { Button } from "@/components/ui/button";

export default function DeleteInvestmentButton({ symbol }: { symbol: string }) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await deleteInvestment(symbol);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isPending}
        className="h-10 w-full bg-red-500 text-gray-950 hover:bg-red-500"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
        Remove
      </Button>
      {message ? <p className="text-xs text-gray-500">{message}</p> : null}
    </div>
  );
}

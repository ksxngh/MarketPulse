"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { addToWatchlist, removeFromWatchlist } from "@/actions/watchlist.actions";
import { Button } from "@/components/ui/button";

export default function WatchlistButton({
  symbol,
  company,
  initialInWatchlist,
}: {
  symbol: string;
  company: string;
  initialInWatchlist: boolean;
}) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = inWatchlist
        ? await removeFromWatchlist(symbol)
        : await addToWatchlist(symbol, company);

      if (result.ok) {
        setInWatchlist(!inWatchlist);
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending} className={inWatchlist ? "watchlist-btn watchlist-remove" : "watchlist-btn"}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : inWatchlist ? <Trash2 className="size-4" /> : <Plus className="size-4" />}
      {inWatchlist ? "Remove" : "Add to watchlist"}
    </Button>
  );
}

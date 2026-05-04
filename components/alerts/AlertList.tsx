"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { deletePriceAlert, reactivatePriceAlert } from "@/actions/alert.actions";
import { Button } from "@/components/ui/button";

type AlertView = {
  id: string;
  symbol: string;
  company: string;
  direction: "above" | "below";
  targetPrice: number;
  lastCheckedPrice?: number;
  status: string;
  firedAt?: string;
  createdAt: string;
};

export default function AlertList({ alerts }: { alerts: AlertView[] }) {
  const [isPending, startTransition] = useTransition();

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-700 bg-gray-800 px-4 py-10 text-center">
        <p className="font-medium text-gray-300">No alerts yet</p>
        <p className="mt-2 text-sm text-gray-500">Open a stock page and create your first price alert.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="grid gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4 lg:grid-cols-[1fr_180px_160px_160px] lg:items-center">
          <Link href={`/stocks/${alert.symbol}`} className="group">
            <p className="flex items-center gap-2 text-xl font-semibold text-gray-100">
              {alert.symbol}
              <ArrowRight className="size-4 text-gray-500 transition-colors group-hover:text-yellow-400" />
            </p>
            <p className="mt-1 text-sm text-gray-500">{alert.company}</p>
          </Link>

          <div>
            <p className="text-sm text-gray-500">Target</p>
            <p className="font-semibold text-gray-100">
              {alert.direction} ${alert.targetPrice.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className={alert.status === "fired" ? "font-semibold text-yellow-400" : "font-semibold text-teal-400"}>
              {alert.status === "fired" ? "Fired" : "Active"}
            </p>
          </div>

          <div className="flex gap-2 lg:justify-end">
            {alert.status === "fired" ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isPending}
                title="Reactivate alert"
                onClick={() => startTransition(() => void reactivatePriceAlert(alert.id))}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isPending}
              title="Delete alert"
              onClick={() => startTransition(() => void deletePriceAlert(alert.id))}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </Button>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <BellRing className="size-4 text-yellow-400" />
        Active alerts are checked by the Inngest polling workflow.
      </div>
    </div>
  );
}

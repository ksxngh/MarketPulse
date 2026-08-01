"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { sendDailySummaryNow } from "@/actions/email.actions";
import { Button } from "@/components/ui/button";

export default function BriefingTestButton() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await sendDailySummaryNow();
        setMessage(result.message);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not send briefing.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-100">Daily summary</p>
          <p className="mt-1 text-sm text-gray-500">Send yourself a briefing now to test email delivery.</p>
        </div>
        <Button type="button" variant="outline" disabled={isPending} onClick={handleClick}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          Send briefing now
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-gray-400">{message}</p> : null}
    </div>
  );
}

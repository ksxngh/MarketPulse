"use client";

import { useEffect, useRef } from "react";

type WidgetType = "symbol-info" | "advanced-chart" | "technical-analysis" | "company-profile" | "financials";

const widgetSources: Record<WidgetType, string> = {
  "symbol-info": "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
  "advanced-chart": "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
  "technical-analysis": "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
  "company-profile": "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
  financials: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
};

export default function TradingViewWidget({
  symbol,
  type,
  height = 420,
}: {
  symbol: string;
  type: WidgetType;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = widgetSources[type];
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbol,
      width: "100%",
      height,
      locale: "en",
      colorTheme: "dark",
      autosize: type === "advanced-chart",
      isTransparent: true,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      backgroundColor: "rgba(20, 20, 20, 1)",
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);
  }, [height, symbol, type]);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
      <div ref={containerRef} style={{ minHeight: height }} />
    </div>
  );
}

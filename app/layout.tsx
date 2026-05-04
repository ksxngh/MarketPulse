import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketPulse",
  description:
    "Track markets, manage a personal watchlist, and receive AI-powered market briefings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className="bg-gray-900 text-gray-100 antialiased"
      >
        {children}
      </body>
    </html>
  );
}

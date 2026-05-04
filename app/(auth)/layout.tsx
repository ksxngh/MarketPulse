import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user.actions";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex items-center justify-center px-6 py-12">
          {children}
        </section>
        <section className="hidden border-l border-gray-700 bg-gray-800 p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-gray-950">
              MarketPulse
            </div>
            <h2 className="mt-10 max-w-xl text-4xl font-semibold leading-tight text-gray-100">
              A focused command center for watchlists, charts, market search, and AI briefings.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {["Live symbol search", "TradingView chart pages", "AI email workflows"].map((item) => (
              <div key={item} className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-400">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

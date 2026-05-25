import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/actions/user.actions";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex items-center justify-center px-6 py-12">
          {children}
        </section>
        <section className="hidden overflow-hidden border-l border-gray-700 bg-gray-800 p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-gray-950">
              MarketPulse
            </div>
            <h2 className="mt-10 max-w-xl text-4xl font-semibold leading-tight text-gray-100">
              Track positions, watchlists, charts, and market moves in one
              focused workspace.
            </h2>
          </div>
          <div className="relative mt-10">
            <div className="overflow-hidden rounded-lg border border-gray-700 bg-black shadow-2xl shadow-black/50">
              <Image
                src="/assets/images/auth-market-visual.png"
                alt="Market dashboard illustration"
                width={960}
                height={1200}
                priority
                className="h-[560px] w-full object-cover"
              />
            </div>
            <div className="absolute bottom-5 left-5 grid w-[calc(100%-40px)] grid-cols-3 gap-3">
              {[
                ["Search", "Live"],
                ["Portfolio", "P/L"],
                ["Charts", "Daily"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-gray-700 bg-gray-900/90 p-3 backdrop-blur"
                >
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-gray-100">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

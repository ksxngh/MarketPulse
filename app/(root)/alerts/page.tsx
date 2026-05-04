import AlertList from "@/components/alerts/AlertList";
import { getUserAlerts } from "@/actions/alert.actions";

export default async function AlertsPage() {
  const alerts = await getUserAlerts();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-yellow-400">Alerts</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-100">Price triggers</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          Create above or below price alerts from stock pages. Fired alerts are emailed and marked complete.
        </p>
      </section>

      <AlertList alerts={alerts} />
    </div>
  );
}

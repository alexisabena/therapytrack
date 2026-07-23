import { getRecentEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function HistorialPage() {
  const events = await getRecentEvents(150);

  return (
    <div className="px-4 pt-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Historial</h1>
        <p className="text-sm text-neutral-500">Últimas dosis registradas.</p>
      </header>

      {events.length === 0 && (
        <p className="text-sm text-neutral-500 bg-white rounded-2xl border border-neutral-200 px-4 py-6 text-center">
          Aún no hay registros.
        </p>
      )}

      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-neutral-900 truncate">
                {event.medication?.name ?? "Medicamento eliminado"}{" "}
                <span className="text-neutral-500 font-normal">{event.medication?.strength}</span>
              </p>
              <p className="text-xs text-neutral-500">
                {formatDateTime(event.actual_at)} · {event.caregiver_name}
              </p>
            </div>
            <span
              className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${
                event.status === "taken" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {event.status === "taken" ? "Tomado" : "Omitido"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

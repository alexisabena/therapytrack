import { AlertTriangle } from "lucide-react";
import { getActiveMedications, getEventsForDate } from "@/lib/data";
import { activePrnMedications, getDueItemsForToday, nowInTz, stockFlag } from "@/lib/schedule";
import { DoseCard } from "@/components/dose-card";
import { PrnCard } from "@/components/prn-card";
import { AutoRefresh } from "@/components/auto-refresh";
import Link from "next/link";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export default async function AhoraPage() {
  const now = nowInTz();
  const [medications, events] = await Promise.all([getActiveMedications(), getEventsForDate(now.date)]);
  const dueItems = getDueItemsForToday(medications, events, now);
  const prnMeds = activePrnMedications(medications);
  const lowStock = medications.filter((m) => stockFlag(m, now.date).low);

  const pending = dueItems.filter((i) => i.state !== "done_taken" && i.state !== "done_skipped");
  const done = dueItems.filter((i) => i.state === "done_taken" || i.state === "done_skipped");

  const [y, m, d] = now.date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

  return (
    <div className="px-4 pt-6 space-y-5">
      <AutoRefresh />
      <header>
        <p className="text-sm text-neutral-500 capitalize">{weekday}, {now.date.split("-").reverse().join("/")}</p>
        <h1 className="text-2xl font-bold text-neutral-900">Ahora — {now.time}</h1>
      </header>

      {lowStock.length > 0 && (
        <Link
          href="/inventario"
          className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-300 px-4 py-3 active:bg-amber-100"
        >
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            <span className="font-semibold">{lowStock.length === 1 ? "1 medicamento" : `${lowStock.length} medicamentos`} por agotarse:</span>{" "}
            {lowStock.map((m) => m.name).join(", ")}. Revisar Existencia.
          </p>
        </Link>
      )}

      {pending.length === 0 && (
        <p className="text-sm text-neutral-500 bg-white rounded-2xl border border-neutral-200 px-4 py-6 text-center">
          No hay dosis pendientes en este momento.
        </p>
      )}

      <div className="space-y-3">
        {pending.map((item) => (
          <DoseCard key={`${item.medication.id}-${item.scheduledTime ?? "weekly"}`} item={item} />
        ))}
      </div>

      {prnMeds.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">
            Por razon necesaria (PRN)
          </h2>
          <div className="space-y-3">
            {prnMeds.map((med) => (
              <PrnCard key={med.id} medication={med} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">Ya registrado hoy</h2>
          <div className="space-y-3">
            {done.map((item) => (
              <DoseCard key={`${item.medication.id}-${item.scheduledTime ?? "weekly"}-done`} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllMedications, getEventsForDate, getMedicationStatusEvents } from "@/lib/data";
import { activePrnMedicationsOnDate, getAgendaForDate, nowInTz } from "@/lib/schedule";
import { DoseCard } from "@/components/dose-card";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = nowInTz().date;
  const date = dateParam ?? today;

  const [medications, events, statusEvents] = await Promise.all([
    getAllMedications(),
    getEventsForDate(date),
    getMedicationStatusEvents(),
  ]);
  const items = getAgendaForDate(medications, events, statusEvents, date);
  const prnMeds = activePrnMedicationsOnDate(medications, statusEvents, date).filter(
    (m) => m.start_date <= date && (!m.course_end_date || m.course_end_date >= date)
  );

  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

  return (
    <div className="px-4 pt-6 space-y-5">
      <header className="flex items-center justify-between">
        <Link
          href={`/agenda?date=${shiftDate(date, -1)}`}
          className="flex items-center justify-center w-11 h-11 rounded-full active:bg-neutral-200"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="text-center">
          <p className="text-sm text-neutral-500 capitalize">{weekday}</p>
          <h1 className="text-lg font-bold text-neutral-900">{date.split("-").reverse().join("/")}</h1>
          {date !== today && (
            <Link href="/agenda" className="text-xs text-blue-600 font-medium">
              Volver a hoy
            </Link>
          )}
        </div>
        <Link
          href={`/agenda?date=${shiftDate(date, 1)}`}
          className="flex items-center justify-center w-11 h-11 rounded-full active:bg-neutral-200"
        >
          <ChevronRight size={22} />
        </Link>
      </header>

      {items.length === 0 && (
        <p className="text-sm text-neutral-500 bg-white rounded-2xl border border-neutral-200 px-4 py-6 text-center">
          Sin medicamentos programados este día.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <DoseCard key={`${item.medication.id}-${item.scheduledTime ?? "weekly"}`} item={item} />
        ))}
      </div>

      {prnMeds.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">
            Por razón necesaria (PRN) — vigente este día
          </h2>
          <div className="space-y-2">
            {prnMeds.map((med) => (
              <div key={med.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-neutral-900">{med.name}</span>
                  <span className="text-sm text-neutral-500">{med.strength}</span>
                </div>
                <p className="text-sm text-neutral-600 mt-0.5">
                  {med.dose_description} — {med.condition_note}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

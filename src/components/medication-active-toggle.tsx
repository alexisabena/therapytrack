"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Medication, MedicationStatusEvent } from "@/lib/types";
import { nowInTz } from "@/lib/schedule";

function formatDateShort(iso: string): string {
  return nowInTz(new Date(iso)).date.split("-").reverse().join("/");
}

function formatDateTime(iso: string): string {
  const { date, time } = nowInTz(new Date(iso));
  return `${date.split("-").reverse().join("/")}, ${time}`;
}

/** Rotation status + timestamped change history. The toggle action itself lives in the
 * card's dropdown menu now, so this is display-only. */
export function MedicationActiveToggle({
  medication,
  statusEvents,
  scheduleText,
}: {
  medication: Medication;
  statusEvents: MedicationStatusEvent[];
  scheduleText?: string;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const sortedEvents = [...statusEvents].sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  const latest = sortedEvents[0];

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${medication.active ? "text-green-700" : "text-neutral-500"}`}>
          {medication.active ? "En rotación" : "Fuera de rotación"}
        </span>
        {scheduleText && <span className="text-xs text-neutral-500">{scheduleText}</span>}
      </div>
      {latest && (
        <p className="text-xs text-neutral-400 mt-0.5">
          {latest.active ? "Activo desde" : "Detenido"} {formatDateShort(latest.changed_at)}
        </p>
      )}

      {sortedEvents.length > 1 && (
        <div className="mt-2">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex items-center gap-1 text-xs font-medium text-neutral-500 py-1 min-h-[44px] active:text-neutral-800"
          >
            <ChevronDown size={12} className={historyOpen ? "rotate-180" : ""} />
            {historyOpen ? "Ocultar historial" : `Ver historial completo (${sortedEvents.length} cambios)`}
          </button>
          {historyOpen && (
            <ul className="space-y-1 pb-1">
              {sortedEvents.map((e) => (
                <li key={e.id} className="text-xs text-neutral-500">
                  {e.active ? "Reactivado" : "Detenido"} {formatDateTime(e.changed_at)} · {e.caregiver_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

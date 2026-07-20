"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import type { Medication, MedicationStatusEvent } from "@/lib/types";
import { nowInTz } from "@/lib/schedule";
import { useCaregiver } from "@/lib/caregiver-context";
import { setMedicationActiveAction } from "@/app/(app)/actions";

function formatDateShort(iso: string): string {
  return nowInTz(new Date(iso)).date.split("-").reverse().join("/");
}

function formatDateTime(iso: string): string {
  const { date, time } = nowInTz(new Date(iso));
  return `${date.split("-").reverse().join("/")}, ${time}`;
}

/** Status label + on/off toggle + timestamped change history, shared between Medicamentos and Existencia. */
export function MedicationActiveToggle({
  medication,
  statusEvents,
}: {
  medication: Medication;
  statusEvents: MedicationStatusEvent[];
}) {
  const { name } = useCaregiver();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const sortedEvents = [...statusEvents].sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  const latest = sortedEvents[0];

  function toggleActive() {
    startTransition(() => setMedicationActiveAction(medication.id, !medication.active, name ?? "Sin nombre"));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-xs font-semibold ${medication.active ? "text-green-700" : "text-neutral-500"}`}>
            {medication.active ? "En rotacion" : "Fuera de rotacion"}
          </span>
          {latest && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {latest.active ? "Activo desde" : "Detenido"} {formatDateShort(latest.changed_at)}
            </p>
          )}
        </div>
        <button
          onClick={toggleActive}
          disabled={pending}
          className={`text-xs font-medium rounded-lg px-3 py-2 min-h-[44px] disabled:opacity-50 ${
            medication.active
              ? "text-red-700 border border-red-200 active:bg-red-50"
              : "text-blue-700 border border-blue-200 active:bg-blue-50"
          }`}
        >
          {medication.active ? "Quitar del horario" : "Reactivar en el horario"}
        </button>
      </div>

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

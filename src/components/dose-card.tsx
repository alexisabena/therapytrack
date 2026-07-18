"use client";

import { useTransition } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { DueItem } from "@/lib/types";
import { useCaregiver } from "@/lib/caregiver-context";
import { logDoseAction, undoDoseAction } from "@/app/(app)/actions";
import { StatusPill } from "./status-pill";

export function DoseCard({ item }: { item: DueItem }) {
  const { name } = useCaregiver();
  const [pending, startTransition] = useTransition();
  const { medication, state, doseEvent, scheduledDate, scheduledTime } = item;
  const isDone = state === "done_taken" || state === "done_skipped";

  function confirm(status: "taken" | "skipped") {
    startTransition(() => {
      logDoseAction({
        medicationId: medication.id,
        scheduledDate,
        scheduledTime,
        status,
        caregiverName: name ?? "Sin nombre",
      });
    });
  }

  function undo() {
    if (!doseEvent) return;
    startTransition(() => undoDoseAction(doseEvent.id));
  }

  return (
    <div
      className={`rounded-2xl border p-4 bg-white ${
        state === "overdue" ? "border-red-300" : state === "due_now" ? "border-amber-300" : "border-neutral-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            {scheduledTime && <span className="text-sm font-bold text-neutral-900">{scheduledTime}</span>}
            <span className="font-semibold text-neutral-900">{medication.name}</span>
            <span className="text-sm text-neutral-500">{medication.strength}</span>
          </div>
          <p className="text-sm text-neutral-600 mt-0.5">{medication.dose_description}</p>
          {medication.condition_note && (
            <p className="text-xs text-neutral-500 italic mt-1">{medication.condition_note}</p>
          )}
        </div>
        <StatusPill state={state} />
      </div>

      {isDone && doseEvent ? (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            {doseEvent.status === "taken" ? "Dado por" : "Omitido por"} {doseEvent.caregiver_name}
          </p>
          <button
            onClick={undo}
            disabled={pending}
            className="flex items-center gap-1 text-xs font-medium text-neutral-500 min-h-[44px] px-2 active:text-neutral-800 disabled:opacity-50"
          >
            <RotateCcw size={14} /> Deshacer
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => confirm("taken")}
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-600 text-white font-semibold py-2.5 min-h-[44px] active:bg-green-700 disabled:opacity-50"
          >
            <Check size={18} /> Tomado
          </button>
          <button
            onClick={() => confirm("skipped")}
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 text-neutral-700 font-semibold py-2.5 min-h-[44px] active:bg-neutral-100 disabled:opacity-50"
          >
            <X size={18} /> Omitir
          </button>
        </div>
      )}
    </div>
  );
}

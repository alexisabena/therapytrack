"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import type { DueItem } from "@/lib/types";
import { useCaregiver } from "@/lib/caregiver-context";
import { logDoseAction, undoDoseAction } from "@/app/(app)/actions";
import { StatusPill } from "./status-pill";
import { DoseDrawer } from "./dose-drawer";

export function DoseCard({ item }: { item: DueItem }) {
  const { name } = useCaregiver();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { medication, state, doseEvent, scheduledDate, scheduledTime } = item;
  const isDone = state === "done_taken" || state === "done_skipped";

  function confirm(status: "taken" | "skipped", actualAt?: string) {
    logDoseAction({
      medicationId: medication.id,
      scheduledDate,
      scheduledTime,
      status,
      caregiverName: name ?? "Sin nombre",
      actualAt,
    });
  }

  function undo() {
    if (!doseEvent) return;
    startTransition(() => undoDoseAction(doseEvent.id));
  }

  return (
    <>
      <div
        role={isDone ? undefined : "button"}
        tabIndex={isDone ? undefined : 0}
        onClick={isDone ? undefined : () => setDrawerOpen(true)}
        onKeyDown={
          isDone
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") setDrawerOpen(true);
              }
        }
        className={`rounded-2xl border p-4 bg-white ${
          state === "overdue" ? "border-red-300" : state === "due_now" ? "border-amber-300" : "border-neutral-200"
        } ${isDone ? "" : "cursor-pointer active:bg-neutral-50"}`}
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
            {!isDone && medication.units_on_hand != null && (
              <p className="text-xs text-neutral-500 mt-1">
                {medication.units_on_hand} {medication.units_label} disponibles
              </p>
            )}
          </div>
          <StatusPill state={state} />
        </div>

        {isDone && doseEvent && (
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">
                {doseEvent.status === "taken" ? "Dado por" : "Omitido por"} {doseEvent.caregiver_name}
              </p>
              {doseEvent.status === "taken" && medication.units_on_hand != null && (
                <p className="text-xs text-neutral-500">
                  Quedan {medication.units_on_hand} {medication.units_label}
                </p>
              )}
            </div>
            <button
              onClick={undo}
              disabled={pending}
              className="flex items-center gap-1 text-xs font-medium text-neutral-500 min-h-[44px] px-2 active:text-neutral-800 disabled:opacity-50"
            >
              <RotateCcw size={14} /> Deshacer
            </button>
          </div>
        )}
      </div>

      {drawerOpen && (
        <DoseDrawer
          medication={medication}
          scheduledDate={scheduledDate}
          scheduledTime={scheduledTime}
          onClose={() => setDrawerOpen(false)}
          onConfirm={(actualAt) => confirm("taken", actualAt)}
          onSkip={() => confirm("skipped")}
        />
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import type { Medication } from "@/lib/types";
import { localToInstant } from "@/lib/schedule";
import { SwipeConfirm } from "./swipe-confirm";

export function DoseDrawer({
  medication,
  scheduledDate,
  scheduledTime = null,
  onClose,
  onConfirm,
  onSkip,
}: {
  medication: Medication;
  scheduledDate?: string;
  scheduledTime?: string | null;
  onClose: () => void;
  onConfirm: (actualAt?: string) => void;
  onSkip?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [actualTime, setActualTime] = useState(scheduledTime ?? "");

  function handleConfirm() {
    const actualAt =
      scheduledDate && actualTime.trim() !== "" ? localToInstant(scheduledDate, actualTime).toISOString() : undefined;
    startTransition(() => onConfirm(actualAt));
    setTimeout(onClose, 500);
  }

  function handleSkip() {
    startTransition(() => onSkip?.());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-8">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 flex items-center justify-center w-11 h-11 rounded-full text-neutral-400 active:bg-neutral-100"
        >
          <X size={22} />
        </button>

        <div className="pr-10">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-neutral-900">{medication.name}</span>
            <span className="text-base text-neutral-500">{medication.strength}</span>
          </div>
          <p className="text-base text-neutral-600 mt-1">{medication.dose_description}</p>
          {medication.condition_note && (
            <p className="text-sm text-neutral-500 italic mt-1">{medication.condition_note}</p>
          )}
        </div>

        <div className="mt-5 mb-6 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-4 text-center">
          {medication.units_per_dose == null ? (
            <p className="text-sm text-neutral-500">
              Existencia no se descuenta automaticamente — ajusta manualmente en Existencia.
            </p>
          ) : medication.units_on_hand != null ? (
            <>
              <p className="text-3xl font-bold text-neutral-900">
                {medication.units_on_hand} <span className="text-lg font-medium text-neutral-500">{medication.units_label}</span>
              </p>
              <p className="text-xs text-neutral-500 mt-1">disponibles ahora — compara con el blister antes de confirmar</p>
            </>
          ) : (
            <p className="text-sm text-neutral-500">Existencia no registrada para este medicamento.</p>
          )}
        </div>

        {scheduledTime != null && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              Hora real (si fue distinta a la programada, incluso en dias pasados)
            </label>
            <input
              type="time"
              value={actualTime}
              onChange={(e) => setActualTime(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
            />
          </div>
        )}

        <SwipeConfirm onConfirm={handleConfirm} disabled={pending} />

        {onSkip && (
          <button
            onClick={handleSkip}
            disabled={pending}
            className="w-full mt-4 text-center text-sm font-medium text-neutral-500 min-h-[44px] active:text-neutral-800 disabled:opacity-50"
          >
            Omitir esta dosis
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import type { Medication } from "@/lib/types";
import { useCaregiver } from "@/lib/caregiver-context";
import { logPrnDoseAction } from "@/app/(app)/actions";

export function PrnCard({ medication }: { medication: Medication }) {
  const { name } = useCaregiver();
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-semibold text-neutral-900">{medication.name}</span>
        <span className="text-sm text-neutral-500">{medication.strength}</span>
      </div>
      <p className="text-sm text-neutral-600 mt-0.5">{medication.dose_description}</p>
      {medication.condition_note && <p className="text-xs text-neutral-500 italic mt-1">{medication.condition_note}</p>}
      <button
        disabled={pending}
        onClick={() =>
          startTransition(() => logPrnDoseAction({ medicationId: medication.id, caregiverName: name ?? "Sin nombre" }))
        }
        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-white font-semibold py-2.5 min-h-[44px] active:bg-neutral-800 disabled:opacity-50"
      >
        <Plus size={18} /> Registrar dosis ahora
      </button>
    </div>
  );
}

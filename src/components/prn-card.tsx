"use client";

import { useState } from "react";
import type { Medication } from "@/lib/types";
import { useCaregiver } from "@/lib/caregiver-context";
import { logPrnDoseAction } from "@/app/(app)/actions";
import { DoseDrawer } from "./dose-drawer";

export function PrnCard({ medication }: { medication: Medication }) {
  const { name } = useCaregiver();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDrawerOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setDrawerOpen(true);
        }}
        className="rounded-2xl border border-neutral-200 bg-white p-4 cursor-pointer active:bg-neutral-50"
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-neutral-900">{medication.name}</span>
          <span className="text-sm text-neutral-500">{medication.strength}</span>
        </div>
        <p className="text-sm text-neutral-600 mt-0.5">{medication.dose_description}</p>
        {medication.condition_note && <p className="text-xs text-neutral-500 italic mt-1">{medication.condition_note}</p>}
        <p className="text-xs text-neutral-400 mt-2">Toca para registrar una dosis</p>
      </div>

      {drawerOpen && (
        <DoseDrawer
          medication={medication}
          onClose={() => setDrawerOpen(false)}
          onConfirm={() => logPrnDoseAction({ medicationId: medication.id, caregiverName: name ?? "Sin nombre" })}
        />
      )}
    </>
  );
}

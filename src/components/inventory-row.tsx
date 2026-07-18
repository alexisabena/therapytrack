"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import type { Medication } from "@/lib/types";
import { daysOfSupply, stockFlag } from "@/lib/schedule";
import { adjustUnitsAction } from "@/app/(app)/actions";

export function InventoryRow({ medication, today }: { medication: Medication; today: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(medication.units_on_hand ?? ""));
  const [pending, startTransition] = useTransition();

  const supply = daysOfSupply(medication);
  const flag = stockFlag(medication, today);

  function save() {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;
    startTransition(() => adjustUnitsAction(medication.id, parsed));
    setEditing(false);
  }

  return (
    <div className={`rounded-2xl border bg-white p-4 ${flag.low ? "border-amber-300" : "border-neutral-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900">{medication.name}</span>
            <span className="text-sm text-neutral-500">{medication.strength}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">{medication.duration_description}</p>
        </div>
        {flag.low && <AlertTriangle size={20} className="text-amber-600 shrink-0" />}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="w-24 rounded-lg border border-neutral-300 px-2 py-2 text-base"
            />
            <span className="text-sm text-neutral-500">{medication.units_label}</span>
            <button
              onClick={save}
              disabled={pending}
              className="rounded-lg bg-blue-600 text-white text-sm font-semibold px-3 py-2 min-h-[44px] active:bg-blue-700 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 min-h-[44px]">
            <span className="text-lg font-bold text-neutral-900">
              {medication.units_on_hand ?? "—"} {medication.units_label}
            </span>
            <Pencil size={14} className="text-neutral-400" />
          </button>
        )}

        {supply != null && (
          <span className={`text-sm font-medium ${flag.low ? "text-amber-700" : "text-neutral-500"}`}>
            ~{Math.floor(supply)} dias
          </span>
        )}
      </div>

      {flag.reason && <p className="text-xs text-amber-700 mt-1.5">{flag.reason}</p>}
      {medication.units_on_hand == null && !editing && (
        <p className="text-xs text-neutral-400 mt-1.5">Existencia no registrada — toca para ingresarla</p>
      )}
    </div>
  );
}

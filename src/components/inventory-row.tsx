"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Clock, Pencil, Plus } from "lucide-react";
import type { Medication, MedicationStatusEvent } from "@/lib/types";
import { daysOfSupply, stockFlag } from "@/lib/schedule";
import { adjustUnitsAction, restockUnitsAction } from "@/app/(app)/actions";
import { MedicationForm } from "./medication-form";
import { MedicationActiveToggle } from "./medication-active-toggle";

type Mode = "view" | "restock" | "correct";

export function InventoryRow({
  medication,
  today,
  statusEvents,
}: {
  medication: Medication;
  today: string;
  statusEvents: MedicationStatusEvent[];
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [restockValue, setRestockValue] = useState("");
  const [correctValue, setCorrectValue] = useState(String(medication.units_on_hand ?? ""));
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [pending, startTransition] = useTransition();

  // Burn-rate/low-stock framing assumes the medicine is actively being dosed at its
  // stored cadence — misleading once it's out of rotation, so skip it entirely then.
  const supply = medication.active ? daysOfSupply(medication) : null;
  const flag = medication.active ? stockFlag(medication, today) : { low: false, reason: null };

  const addedUnits = Number(restockValue);
  const validAdd = restockValue.trim() !== "" && !Number.isNaN(addedUnits) && addedUnits > 0;
  const newTotal = validAdd ? (medication.units_on_hand ?? 0) + addedUnits : null;

  function submitRestock() {
    if (!validAdd) return;
    startTransition(() => restockUnitsAction(medication.id, addedUnits));
    setMode("view");
    setRestockValue("");
  }

  function submitCorrection() {
    const parsed = Number(correctValue);
    if (Number.isNaN(parsed) || parsed < 0) return;
    startTransition(() => adjustUnitsAction(medication.id, parsed));
    setMode("view");
  }

  return (
    <>
    <div
      className={`rounded-2xl border bg-white p-4 ${
        flag.low ? "border-amber-300" : "border-neutral-200"
      } ${medication.active ? "" : "opacity-60"}`}
    >
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
        <span className="text-lg font-bold text-neutral-900">
          {medication.units_on_hand ?? "—"} {medication.units_label}
        </span>
        {supply != null && (
          <span className={`text-sm font-medium ${flag.low ? "text-amber-700" : "text-neutral-500"}`}>
            ~{Math.floor(supply)} dias
          </span>
        )}
      </div>

      {flag.reason && <p className="text-xs text-amber-700 mt-1.5">{flag.reason}</p>}
      {medication.units_on_hand == null && mode === "view" && (
        <p className="text-xs text-neutral-400 mt-1.5">Existencia no registrada</p>
      )}

      <div className="mt-3">
        <MedicationActiveToggle medication={medication} statusEvents={statusEvents} />
      </div>

      {mode === "view" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setMode("restock")}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-sm font-semibold py-2.5 min-h-[44px] active:bg-blue-700"
          >
            <Plus size={16} /> Agregar existencia
          </button>
          <button
            onClick={() => {
              setCorrectValue(String(medication.units_on_hand ?? ""));
              setMode("correct");
            }}
            aria-label="Corregir cantidad total"
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-neutral-300 text-neutral-500 active:bg-neutral-100"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setEditingSchedule(true)}
            aria-label="Editar dosis y horario"
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-neutral-300 text-neutral-500 active:bg-neutral-100"
          >
            <Clock size={16} />
          </button>
        </div>
      )}

      {mode === "restock" && (
        <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 p-3">
          <label className="block text-xs font-medium text-blue-900 mb-1.5">
            ¿Cuantas {medication.units_label} compraste?
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={restockValue}
              onChange={(e) => setRestockValue(e.target.value)}
              autoFocus
              placeholder="0"
              className="w-24 rounded-lg border border-neutral-300 px-2 py-2 text-base"
            />
            <span className="text-sm text-neutral-600">{medication.units_label}</span>
          </div>
          {newTotal != null && (
            <p className="text-sm text-blue-800 mt-2">
              Nuevo total: <span className="font-bold">{newTotal} {medication.units_label}</span>
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={submitRestock}
              disabled={!validAdd || pending}
              className="flex-1 rounded-lg bg-blue-600 text-white text-sm font-semibold py-2.5 min-h-[44px] active:bg-blue-700 disabled:opacity-40"
            >
              Confirmar
            </button>
            <button
              onClick={() => {
                setMode("view");
                setRestockValue("");
              }}
              disabled={pending}
              className="rounded-lg border border-neutral-300 text-neutral-600 text-sm font-medium px-4 py-2.5 min-h-[44px] active:bg-neutral-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === "correct" && (
        <div className="mt-3 rounded-xl bg-neutral-50 border border-neutral-200 p-3">
          <label className="block text-xs font-medium text-neutral-600 mb-1.5">
            Corregir cantidad total (no suma, reemplaza)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={correctValue}
              onChange={(e) => setCorrectValue(e.target.value)}
              autoFocus
              className="w-24 rounded-lg border border-neutral-300 px-2 py-2 text-base"
            />
            <span className="text-sm text-neutral-500">{medication.units_label}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={submitCorrection}
              disabled={pending}
              className="flex-1 rounded-lg bg-neutral-900 text-white text-sm font-semibold py-2.5 min-h-[44px] active:bg-neutral-800 disabled:opacity-40"
            >
              Guardar
            </button>
            <button
              onClick={() => setMode("view")}
              disabled={pending}
              className="rounded-lg border border-neutral-300 text-neutral-600 text-sm font-medium px-4 py-2.5 min-h-[44px] active:bg-neutral-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>

    {editingSchedule && <MedicationForm medication={medication} onClose={() => setEditingSchedule(false)} />}
    </>
  );
}

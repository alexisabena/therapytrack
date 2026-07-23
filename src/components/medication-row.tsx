"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, MoreVertical, Package } from "lucide-react";
import type { Medication, MedicationStatusEvent } from "@/lib/types";
import { daysOfSupply, stockFlag } from "@/lib/schedule";
import { useCaregiver } from "@/lib/caregiver-context";
import { adjustUnitsAction, restockUnitsAction, setMedicationActiveAction } from "@/app/(app)/actions";
import { MedicationForm } from "./medication-form";
import { MedicationActiveToggle } from "./medication-active-toggle";

type StockMode = "view" | "restock" | "correct";

function scheduleSummary(med: Medication): string {
  if (med.schedule_type === "prn") return "Por razon necesaria (PRN)";
  if (med.schedule_type === "weekly") {
    const days = med.weekly_interval_days ?? 7;
    return days === 7 ? "Semanal" : `Cada ${days} dias`;
  }
  if (med.times.length === 0) return "Sin horario";
  return med.times.join(", ");
}

export function MedicationRow({
  medication,
  today,
  statusEvents,
}: {
  medication: Medication;
  today: string;
  statusEvents: MedicationStatusEvent[];
}) {
  const { name } = useCaregiver();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stockMode, setStockMode] = useState<StockMode>("view");
  const [restockValue, setRestockValue] = useState("");
  const [correctValue, setCorrectValue] = useState(String(medication.units_on_hand ?? ""));
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
    setStockMode("view");
    setRestockValue("");
  }

  function submitCorrection() {
    const parsed = Number(correctValue);
    if (Number.isNaN(parsed) || parsed < 0) return;
    startTransition(() => adjustUnitsAction(medication.id, parsed));
    setStockMode("view");
  }

  function toggleActive() {
    setMenuOpen(false);
    startTransition(() => setMedicationActiveAction(medication.id, !medication.active, name ?? "Sin nombre"));
  }

  return (
    <>
      <div
        className={`rounded-2xl border bg-white p-4 ${flag.low ? "border-amber-300" : "border-neutral-200"} ${
          medication.active ? "" : "opacity-60"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xl font-bold text-neutral-900 block truncate">{medication.name}</span>
            <p className="text-sm text-neutral-600 mt-0.5">
              {medication.strength}, {medication.route}
            </p>
            <p className="text-sm text-neutral-500 italic mt-1">{medication.dose_description}</p>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Mas opciones"
              className="flex items-center justify-center w-11 h-11 rounded-xl border border-neutral-300 text-neutral-500 active:bg-neutral-100"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-neutral-200 bg-white shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={toggleActive}
                    disabled={pending}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-700 active:bg-red-50 disabled:opacity-50"
                  >
                    {medication.active ? "Quitar del horario" : "Reactivar en el horario"}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-neutral-700 active:bg-neutral-50 border-t border-neutral-100"
                  >
                    Editar medicamento
                  </button>
                </div>
              </>
            )}
          </div>
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

        {flag.low && flag.reason && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span className="text-xs text-amber-800">{flag.reason}</span>
          </div>
        )}
        {medication.units_on_hand == null && stockMode === "view" && (
          <p className="text-xs text-neutral-400 mt-1.5">Existencia no registrada</p>
        )}

        <div className="mt-3 pt-3 border-t border-neutral-100">
          <p className="text-xs text-neutral-500 mb-1.5">{scheduleSummary(medication)}</p>
          <MedicationActiveToggle medication={medication} statusEvents={statusEvents} />
        </div>

        {stockMode === "view" && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setStockMode("restock")}
              className="flex-1 rounded-xl bg-blue-600 text-white text-sm font-semibold py-2.5 min-h-[44px] active:bg-blue-700"
            >
              Agregar existencia
            </button>
            <button
              onClick={() => {
                setCorrectValue(String(medication.units_on_hand ?? ""));
                setStockMode("correct");
              }}
              aria-label="Corregir cantidad total"
              className="flex items-center justify-center w-11 h-11 rounded-xl border border-neutral-300 text-neutral-500 active:bg-neutral-100 shrink-0"
            >
              <Package size={16} />
            </button>
          </div>
        )}

        {stockMode === "restock" && (
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
                  setStockMode("view");
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

        {stockMode === "correct" && (
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
                onClick={() => setStockMode("view")}
                disabled={pending}
                className="rounded-lg border border-neutral-300 text-neutral-600 text-sm font-medium px-4 py-2.5 min-h-[44px] active:bg-neutral-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {editing && <MedicationForm medication={medication} onClose={() => setEditing(false)} />}
    </>
  );
}

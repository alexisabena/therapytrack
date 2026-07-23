"use client";

import { useState, useTransition } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Medication } from "@/lib/types";
import { generateIntervalTimes } from "@/lib/schedule";
import { createMedicationAction, updateMedicationAction, type MedicationInput } from "@/app/(app)/actions";

type FrequencyMode = "every_8h" | "every_12h" | "every_24h" | "custom" | "weekly" | "prn";

function todayLocalDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialFrequencyMode(med?: Medication): FrequencyMode {
  if (!med) return "every_8h";
  if (med.schedule_type === "weekly") return "weekly";
  if (med.schedule_type === "prn") return "prn";
  if (med.interval_hours === 8) return "every_8h";
  if (med.interval_hours === 12) return "every_12h";
  if (med.interval_hours === 24) return "every_24h";
  return "custom";
}

const INTERVAL_HOURS_BY_MODE: Partial<Record<FrequencyMode, number>> = {
  every_8h: 8,
  every_12h: 12,
  every_24h: 24,
};

export function MedicationForm({
  medication,
  onClose,
}: {
  medication?: Medication;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!medication;

  const [name, setName] = useState(medication?.name ?? "");
  const [strength, setStrength] = useState(medication?.strength ?? "");
  const [form, setForm] = useState(medication?.form ?? "");
  const [doseDescription, setDoseDescription] = useState(medication?.dose_description ?? "");
  const [route, setRoute] = useState(medication?.route ?? "oral");
  const [conditionNote, setConditionNote] = useState(medication?.condition_note ?? "");
  const [durationDescription, setDurationDescription] = useState(medication?.duration_description ?? "");
  const [isChronic, setIsChronic] = useState(medication?.is_chronic ?? false);
  const [startDate, setStartDate] = useState(medication?.start_date ?? todayLocalDate());
  const [courseEndDate, setCourseEndDate] = useState(medication?.course_end_date ?? "");
  const [unitsPerDose, setUnitsPerDose] = useState(medication?.units_per_dose != null ? String(medication.units_per_dose) : "");
  const [unitsOnHand, setUnitsOnHand] = useState(medication?.units_on_hand != null ? String(medication.units_on_hand) : "");
  const [unitsLabel, setUnitsLabel] = useState(medication?.units_label ?? "unidades");
  const [lowStockThresholdDays, setLowStockThresholdDays] = useState(String(medication?.low_stock_threshold_days ?? 5));
  const [notes, setNotes] = useState(medication?.notes ?? "");

  const [frequencyMode, setFrequencyMode] = useState<FrequencyMode>(initialFrequencyMode(medication));
  const [anchorTime, setAnchorTime] = useState(medication?.times?.[0] ?? "08:00");
  const [customTimes, setCustomTimes] = useState<string[]>(
    medication?.schedule_type === "fixed_times" && medication.times.length > 0 ? medication.times : ["08:00"]
  );
  const [weeklyAnchorDate, setWeeklyAnchorDate] = useState(medication?.weekly_anchor_date ?? todayLocalDate());
  const [weeklyIntervalDays, setWeeklyIntervalDays] = useState(String(medication?.weekly_interval_days ?? 7));

  const previewTimes =
    frequencyMode === "every_8h"
      ? generateIntervalTimes(8, anchorTime)
      : frequencyMode === "every_12h"
      ? generateIntervalTimes(12, anchorTime)
      : frequencyMode === "every_24h"
      ? generateIntervalTimes(24, anchorTime)
      : frequencyMode === "custom"
      ? [...customTimes].filter(Boolean).sort()
      : [];

  const canSubmit = name.trim() !== "" && strength.trim() !== "" && form.trim() !== "" && doseDescription.trim() !== "";

  function addCustomTime() {
    setCustomTimes((t) => [...t, "08:00"]);
  }
  function removeCustomTime(index: number) {
    setCustomTimes((t) => t.filter((_, i) => i !== index));
  }
  function updateCustomTime(index: number, value: string) {
    setCustomTimes((t) => t.map((v, i) => (i === index ? value : v)));
  }

  function submit() {
    if (!canSubmit || pending) return;

    const input: MedicationInput = {
      name: name.trim(),
      strength: strength.trim(),
      form: form.trim(),
      dose_description: doseDescription.trim(),
      route: route.trim(),
      schedule_type: frequencyMode === "weekly" ? "weekly" : frequencyMode === "prn" ? "prn" : "fixed_times",
      times: previewTimes,
      interval_hours: INTERVAL_HOURS_BY_MODE[frequencyMode] ?? null,
      weekly_anchor_date: frequencyMode === "weekly" ? weeklyAnchorDate : null,
      weekly_interval_days: frequencyMode === "weekly" ? Number(weeklyIntervalDays) || 7 : null,
      condition_note: conditionNote.trim() || null,
      duration_description: durationDescription.trim() || null,
      is_chronic: isChronic,
      start_date: startDate,
      course_end_date: courseEndDate || null,
      units_per_dose: unitsPerDose.trim() === "" ? null : Number(unitsPerDose),
      units_on_hand: unitsOnHand.trim() === "" ? null : Number(unitsOnHand),
      units_label: unitsLabel.trim() || "unidades",
      low_stock_threshold_days: Number(lowStockThresholdDays) || 5,
      notes: notes.trim() || null,
    };

    startTransition(async () => {
      if (isEdit) {
        await updateMedicationAction(medication.id, input);
      } else {
        await createMedicationAction(input);
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 flex items-center justify-center w-11 h-11 rounded-full text-neutral-400 active:bg-neutral-100"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-bold text-neutral-900 pr-10">
          {isEdit ? "Editar medicamento" : "Agregar medicamento"}
        </h2>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Paracetamol" />
            </Field>
            <Field label="Concentracion">
              <input value={strength} onChange={(e) => setStrength(e.target.value)} className={inputClass} placeholder="500mg" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Forma">
              <input value={form} onChange={(e) => setForm(e.target.value)} className={inputClass} placeholder="tableta" />
            </Field>
            <Field label="Via">
              <input value={route} onChange={(e) => setRoute(e.target.value)} className={inputClass} placeholder="oral" />
            </Field>
          </div>

          <Field label="Dosis por toma">
            <input
              value={doseDescription}
              onChange={(e) => setDoseDescription(e.target.value)}
              className={inputClass}
              placeholder="1 tableta"
            />
          </Field>

          <Field label="Indicacion (opcional)">
            <input
              value={conditionNote}
              onChange={(e) => setConditionNote(e.target.value)}
              className={inputClass}
              placeholder="Con el desayuno"
            />
          </Field>

          <fieldset>
            <legend className="block text-xs font-medium text-neutral-600 mb-1.5">Frecuencia</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["every_8h", "Cada 8 horas"],
                  ["every_12h", "Cada 12 horas"],
                  ["every_24h", "Cada 24 horas"],
                  ["custom", "Horario personalizado"],
                  ["weekly", "Semanal"],
                  ["prn", "Por razon necesaria"],
                ] as [FrequencyMode, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFrequencyMode(value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left min-h-[44px] ${
                    frequencyMode === value
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "border-neutral-300 text-neutral-600 active:bg-neutral-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {(frequencyMode === "every_8h" || frequencyMode === "every_12h" || frequencyMode === "every_24h") && (
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
              <Field label="Hora de la primera dosis">
                <input
                  type="time"
                  value={anchorTime}
                  onChange={(e) => setAnchorTime(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <p className="text-xs text-neutral-500 mt-2">
                Horarios: <span className="font-medium text-neutral-700">{previewTimes.join(", ")}</span>
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Este horario es solo el punto de partida: cada vez que se confirma una dosis, la siguiente se
                recalcula desde esa hora real, no desde un horario fijo.
              </p>
            </div>
          )}

          {frequencyMode === "custom" && (
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 space-y-2">
              {customTimes.map((time, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateCustomTime(i, e.target.value)}
                    className={inputClass}
                  />
                  {customTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCustomTime(i)}
                      aria-label="Quitar horario"
                      className="flex items-center justify-center w-11 h-11 rounded-lg text-neutral-400 active:bg-neutral-100 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCustomTime}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 min-h-[44px] active:text-blue-800"
              >
                <Plus size={16} /> Agregar horario
              </button>
            </div>
          )}

          {frequencyMode === "weekly" && (
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 grid grid-cols-2 gap-3">
              <Field label="Fecha de aplicacion">
                <input
                  type="date"
                  value={weeklyAnchorDate}
                  onChange={(e) => setWeeklyAnchorDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Cada cuantos dias">
                <input
                  type="number"
                  min={1}
                  value={weeklyIntervalDays}
                  onChange={(e) => setWeeklyIntervalDays(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Fin del curso (opcional)">
              <input
                type="date"
                value={courseEndDate}
                onChange={(e) => setCourseEndDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isChronic}
              onChange={(e) => setIsChronic(e.target.checked)}
              className="w-5 h-5 rounded border-neutral-300"
            />
            Tratamiento cronico (sin fecha de fin)
          </label>

          <Field label="Duracion indicada (texto libre, opcional)">
            <input
              value={durationDescription}
              onChange={(e) => setDurationDescription(e.target.value)}
              className={inputClass}
              placeholder="5 dias"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unidades por dosis (opcional)">
              <input
                type="number"
                min={0}
                step="any"
                value={unitsPerDose}
                onChange={(e) => setUnitsPerDose(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Etiqueta de unidad">
              <input value={unitsLabel} onChange={(e) => setUnitsLabel(e.target.value)} className={inputClass} placeholder="tabletas" />
            </Field>
          </div>

          {!isEdit && (
            <Field label="Existencia inicial (opcional)">
              <input
                type="number"
                min={0}
                step="any"
                value={unitsOnHand}
                onChange={(e) => setUnitsOnHand(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          {isEdit && (
            <p className="text-xs text-neutral-400">
              La existencia se ajusta desde Existencia, no aqui.
            </p>
          )}

          <Field label="Umbral de existencia baja (dias)">
            <input
              type="number"
              min={0}
              value={lowStockThresholdDays}
              onChange={(e) => setLowStockThresholdDays(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Notas (opcional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} />
          </Field>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit || pending}
          className="w-full mt-6 rounded-xl bg-blue-600 text-white text-sm font-semibold py-3 min-h-[44px] active:bg-blue-700 disabled:opacity-40"
        >
          {isEdit ? "Guardar cambios" : "Agregar medicamento"}
        </button>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-base";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

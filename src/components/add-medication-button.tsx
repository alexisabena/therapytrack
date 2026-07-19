"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MedicationForm } from "./medication-form";

export function AddMedicationButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-sm font-semibold py-2.5 min-h-[44px] active:bg-blue-700"
      >
        <Plus size={16} /> Agregar medicamento
      </button>

      {open && <MedicationForm onClose={() => setOpen(false)} />}
    </>
  );
}

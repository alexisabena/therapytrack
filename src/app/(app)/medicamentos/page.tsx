import { getAllMedications } from "@/lib/data";
import { MedicationRow } from "@/components/medication-row";
import { AddMedicationButton } from "@/components/add-medication-button";

export const dynamic = "force-dynamic";

export default async function MedicamentosPage() {
  const medications = await getAllMedications();
  const active = medications.filter((m) => m.active);
  const inactive = medications.filter((m) => !m.active);

  return (
    <div className="px-4 pt-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Medicamentos</h1>
        <p className="text-sm text-neutral-500">Agrega nuevos o quita del horario sin perder el historial.</p>
      </header>

      <AddMedicationButton />

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">En rotacion</h2>
        {active.length === 0 ? (
          <p className="text-sm text-neutral-500 bg-white rounded-2xl border border-neutral-200 px-4 py-6 text-center">
            Sin medicamentos activos.
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((med) => (
              <MedicationRow key={med.id} medication={med} />
            ))}
          </div>
        )}
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">Fuera de rotacion</h2>
          <div className="space-y-3">
            {inactive.map((med) => (
              <MedicationRow key={med.id} medication={med} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

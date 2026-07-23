import { getAllMedications, getMedicationStatusEvents } from "@/lib/data";
import { nowInTz, stockFlag } from "@/lib/schedule";
import { MedicationRow } from "@/components/medication-row";
import { AddMedicationButton } from "@/components/add-medication-button";

export const dynamic = "force-dynamic";

export default async function MedicamentosPage() {
  const today = nowInTz().date;
  const [allMedications, statusEvents] = await Promise.all([getAllMedications(), getMedicationStatusEvents()]);
  const active = allMedications.filter((m) => m.active);
  const inactive = allMedications.filter((m) => !m.active);

  const lowStock = active.filter((m) => stockFlag(m, today).low);
  const ok = active.filter((m) => !stockFlag(m, today).low);

  function eventsFor(medicationId: string) {
    return statusEvents.filter((e) => e.medication_id === medicationId);
  }

  return (
    <div className="px-4 pt-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Medicamentos</h1>
        <p className="text-sm text-neutral-500">
          Agrega nuevos, registra existencia o quita del horario — sin perder el historial.
        </p>
      </header>

      <AddMedicationButton />

      {lowStock.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 mb-2">Por agotarse</h2>
          <div className="space-y-3">
            {lowStock.map((med) => (
              <MedicationRow key={med.id} medication={med} today={today} statusEvents={eventsFor(med.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">En rotación</h2>
        {ok.length === 0 ? (
          <p className="text-sm text-neutral-500 bg-white rounded-2xl border border-neutral-200 px-4 py-6 text-center">
            Sin medicamentos activos.
          </p>
        ) : (
          <div className="space-y-3">
            {ok.map((med) => (
              <MedicationRow key={med.id} medication={med} today={today} statusEvents={eventsFor(med.id)} />
            ))}
          </div>
        )}
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">Fuera de rotación</h2>
          <div className="space-y-3">
            {inactive.map((med) => (
              <MedicationRow key={med.id} medication={med} today={today} statusEvents={eventsFor(med.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

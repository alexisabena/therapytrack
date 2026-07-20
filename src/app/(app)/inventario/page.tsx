import { getAllMedications, getMedicationStatusEvents } from "@/lib/data";
import { nowInTz, stockFlag } from "@/lib/schedule";
import { InventoryRow } from "@/components/inventory-row";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const today = nowInTz().date;
  const [allMedications, statusEvents] = await Promise.all([getAllMedications(), getMedicationStatusEvents()]);
  const medications = allMedications.filter((m) => m.active);
  const inactive = allMedications.filter((m) => !m.active);

  const lowStock = medications.filter((m) => stockFlag(m, today).low);
  const ok = medications.filter((m) => !stockFlag(m, today).low);

  return (
    <div className="px-4 pt-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Existencia</h1>
        <p className="text-sm text-neutral-500">Agrega lo que compraste — no hace falta recontar todo.</p>
      </header>

      {lowStock.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 mb-2">Por agotarse</h2>
          <div className="space-y-3">
            {lowStock.map((med) => (
              <InventoryRow
                key={med.id}
                medication={med}
                today={today}
                statusEvents={statusEvents.filter((e) => e.medication_id === med.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">Todos los medicamentos</h2>
        <div className="space-y-3">
          {ok.map((med) => (
            <InventoryRow
              key={med.id}
              medication={med}
              today={today}
              statusEvents={statusEvents.filter((e) => e.medication_id === med.id)}
            />
          ))}
        </div>
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">Fuera de rotacion</h2>
          <div className="space-y-3">
            {inactive.map((med) => (
              <InventoryRow
                key={med.id}
                medication={med}
                today={today}
                statusEvents={statusEvents.filter((e) => e.medication_id === med.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

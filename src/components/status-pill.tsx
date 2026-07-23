import type { DueState } from "@/lib/types";

const STYLES: Record<DueState, { label: string; className: string }> = {
  overdue: { label: "Atrasado", className: "bg-red-100 text-red-800 border-red-200" },
  due_now: { label: "Ahora", className: "bg-amber-100 text-amber-900 border-amber-200" },
  due_soon: { label: "Pronto", className: "bg-blue-100 text-blue-800 border-blue-200" },
  upcoming: { label: "Más tarde", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  done_taken: { label: "Administrado", className: "bg-green-100 text-green-800 border-green-200" },
  done_skipped: { label: "Omitido", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

export function StatusPill({ state }: { state: DueState }) {
  const { label, className } = STYLES[state];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

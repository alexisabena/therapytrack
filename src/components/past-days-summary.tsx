"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft } from "lucide-react";
import type { DaySummary } from "@/lib/schedule";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function weekdayFor(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function DayRow({ summary }: { summary: DaySummary }) {
  const weekday = weekdayFor(summary.date);
  return (
    <Link
      href={`/agenda?date=${summary.date}`}
      className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 active:bg-neutral-50"
    >
      <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 capitalize shrink-0">
        <ChevronLeft size={16} className="text-neutral-400" />
        {weekday} {summary.date.split("-").reverse().join("/")}
      </span>
      <span className="text-xs text-right">
        <span className="text-green-700 font-medium">
          {summary.administered} administrado{summary.administered !== 1 ? "s" : ""}
        </span>
        {summary.omitted > 0 && (
          <span className="text-neutral-500">
            {" "}
            · <span className="text-amber-700 font-medium">{summary.omitted} omitido{summary.omitted !== 1 ? "s" : ""}</span>
          </span>
        )}
        {summary.pending > 0 && (
          <span className="text-neutral-500">
            {" "}
            · <span className="text-red-600 font-medium">{summary.pending} pendiente{summary.pending !== 1 ? "s" : ""}</span>
          </span>
        )}
      </span>
    </Link>
  );
}

export function PastDaysSummary({ days }: { days: DaySummary[] }) {
  const [expanded, setExpanded] = useState(false);
  if (days.length === 0) return null;

  const [latest, ...rest] = days;

  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-2">Días anteriores</h2>
      <div className="space-y-2">
        <DayRow summary={latest} />

        {rest.length > 0 && (
          <>
            {expanded && rest.map((summary) => <DayRow key={summary.date} summary={summary} />)}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="w-full flex items-center justify-center gap-1 text-xs font-medium text-neutral-500 py-2 min-h-[44px] active:text-neutral-800"
            >
              <ChevronDown size={14} className={expanded ? "rotate-180" : ""} />
              {expanded ? "Ocultar días anteriores" : `Ver ${rest.length} día${rest.length !== 1 ? "s" : ""} más`}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

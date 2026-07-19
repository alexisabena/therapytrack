"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const WATCHED_TABLES = ["dose_events", "medications", "medication_status_events"] as const;

/** Push-based freshness: subscribes to changes instead of polling, and nudges rather than
 * silently reloading so a caregiver mid-action on another screen isn't yanked out from under. */
export function RealtimeNudge() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let channel = supabase.channel("db-changes");
    for (const table of WATCHED_TABLES) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, () => setVisible(true));
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function refresh() {
    setVisible(false);
    router.refresh();
  }

  if (!visible) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-40 flex justify-center px-4 pt-[max(env(safe-area-inset-top),0.5rem)]">
      <div className="w-full max-w-md flex items-center justify-between gap-2 rounded-xl bg-blue-600 text-white text-sm pl-4 pr-2 py-2 shadow-lg">
        <button onClick={refresh} className="flex items-center gap-1.5 font-medium min-h-[40px]">
          <RefreshCw size={14} /> Hay cambios nuevos — Actualizar
        </button>
        <button
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
          className="flex items-center justify-center w-9 h-9 rounded-full active:bg-blue-700 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

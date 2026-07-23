"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "tt_caregiver_name";

type CaregiverContextValue = {
  name: string | null;
  setName: (name: string) => void;
};

const CaregiverContext = createContext<CaregiverContextValue>({ name: null, setName: () => {} });

export function useCaregiver() {
  return useContext(CaregiverContext);
}

export function CaregiverProvider({
  knownCaregivers,
  children,
}: {
  knownCaregivers: string[];
  children: React.ReactNode;
}) {
  const [name, setNameState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reading localStorage must happen post-mount (SSR has no window); this is a one-time hydration read, not a sync loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNameState(window.localStorage.getItem(STORAGE_KEY));
    setHydrated(true);
  }, []);

  function setName(value: string) {
    window.localStorage.setItem(STORAGE_KEY, value);
    setNameState(value);
  }

  if (!hydrated) return null;

  if (!name) {
    return <NamePrompt knownCaregivers={knownCaregivers} onSelect={setName} />;
  }

  return <CaregiverContext.Provider value={{ name, setName }}>{children}</CaregiverContext.Provider>;
}

function NamePrompt({ knownCaregivers, onSelect }: { knownCaregivers: string[]; onSelect: (name: string) => void }) {
  const [custom, setCustom] = useState("");

  return (
    <div className="min-h-dvh flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <h1 className="text-lg font-bold text-neutral-900 mb-1">¿Quién eres?</h1>
        <p className="text-sm text-neutral-500 mb-5">
          Para saber quién confirmó cada dosis. Se recuerda en este teléfono.
        </p>
        <div className="space-y-2 mb-4">
          {knownCaregivers.map((n) => (
            <button
              key={n}
              onClick={() => onSelect(n)}
              className="w-full rounded-xl border border-neutral-300 py-3 text-base font-medium text-neutral-800 active:bg-neutral-100"
            >
              {n}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (custom.trim()) onSelect(custom.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Otro nombre"
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium active:bg-blue-700">
            Listo
          </button>
        </form>
      </div>
    </div>
  );
}

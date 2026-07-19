"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, ListChecks, Package, Pill } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Ahora", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/medicamentos", label: "Medicamentos", icon: Pill },
  { href: "/inventario", label: "Existencia", icon: Package },
  { href: "/historial", label: "Historial", icon: ListChecks },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 pb-[env(safe-area-inset-bottom)] z-20">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium min-h-[44px] justify-center ${
                active ? "text-blue-600" : "text-neutral-500"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

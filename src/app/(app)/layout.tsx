import { CaregiverProvider } from "@/lib/caregiver-context";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CaregiverProvider>
      <div className="flex-1 max-w-md w-full mx-auto pb-20">{children}</div>
      <BottomNav />
    </CaregiverProvider>
  );
}

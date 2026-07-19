import { CaregiverProvider } from "@/lib/caregiver-context";
import { BottomNav } from "@/components/bottom-nav";
import { RealtimeNudge } from "@/components/realtime-nudge";
import { getKnownCaregivers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const knownCaregivers = await getKnownCaregivers();

  return (
    <CaregiverProvider knownCaregivers={knownCaregivers}>
      <RealtimeNudge />
      <div className="flex-1 max-w-md w-full mx-auto pb-20">{children}</div>
      <BottomNav />
    </CaregiverProvider>
  );
}

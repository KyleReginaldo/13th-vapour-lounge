import { getCurrentUser } from "@/lib/auth/roles";
import { MobileBottomNav } from "./MobileBottomNav";

export async function MobileBottomNavWrapper() {
  const user = await getCurrentUser().catch(() => null);

  return <MobileBottomNav user={user} />;
}

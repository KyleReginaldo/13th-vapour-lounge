import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Header } from "./Header";

export async function HeaderWrapper() {
  const user = await getCurrentUser();

  let unreadCount = 0;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    unreadCount = count ?? 0;
  }

  return <Header user={user} unreadNotifCount={unreadCount} />;
}

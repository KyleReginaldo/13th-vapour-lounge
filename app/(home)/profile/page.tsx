import { getUserOrders } from "@/app/actions/profile";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { getCurrentUser } from "@/lib/auth/supabase-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Account | 13th Vapour Lounge",
  description: "Manage your profile, orders, and settings.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?message=Please sign in to view your profile");
  }

  const [orders, { tab }] = await Promise.all([getUserOrders(), searchParams]);

  const defaultTab =
    tab === "orders" ? "orders" : tab === "settings" ? "settings" : "overview";

  return (
    <ProfileClient
      user={user}
      orders={orders}
      defaultTab={defaultTab as "overview" | "orders" | "settings"}
    />
  );
}

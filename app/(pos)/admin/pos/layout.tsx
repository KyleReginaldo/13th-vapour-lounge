import { requireRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin", "staff"]);

  return (
    <div className="h-screen overflow-hidden bg-background">{children}</div>
  );
}

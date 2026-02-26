import { StaffManagement } from "@/components/admin/staff/StaffManagement";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function StaffPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ data: staff }, { data: roles }] = await Promise.all([
    supabase
      .from("users")
      .select("*, role:roles!role_id(id, name)")
      .order("created_at", { ascending: false }),
    supabase.from("roles").select("id, name").order("name"),
  ]);

  const staffMembers = (staff ?? []).filter(
    (u) => (u.role as any)?.name === "staff"
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <p className="text-muted-foreground">
          Manage your team members and their access levels
        </p>
      </div>
      <StaffManagement initialStaff={staffMembers} roles={roles ?? []} />
    </div>
  );
}

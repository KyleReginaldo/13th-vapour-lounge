import { ShiftsPage } from "@/components/admin/staff/ShiftsPage";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ShiftsRoute() {
  const user = await requireRole(["admin", "staff"]);
  const isAdmin = (user.roles as any)?.name === "admin";
  const supabase = await createClient();

  // Registers needed by both roles (for clock-in form)
  const { data: registers } = await supabase
    .from("cash_registers")
    .select("id, name, location")
    .eq("is_active", true)
    .order("name");

  if (isAdmin) {
    const [{ data: shifts }, { data: allUsers }] = await Promise.all([
      supabase
        .from("staff_shifts")
        .select(
          `*, staff:staff_id(first_name, last_name), register:register_id(name)`
        )
        .order("clock_in", { ascending: false })
        .limit(200),
      supabase
        .from("users")
        .select("id, first_name, last_name, role:roles!role_id(name)")
        .order("first_name"),
    ]);

    const staffList = (allUsers ?? []).filter(
      (u) => (u.role as any)?.name === "staff"
    );

    return (
      <div className="p-4 md:p-8">
        <ShiftsPage
          isAdmin={true}
          userId={user.id}
          userName={`${user.first_name} ${user.last_name}`}
          activeShift={null}
          shifts={(shifts ?? []) as any}
          registers={registers ?? []}
          staffList={staffList}
        />
      </div>
    );
  }

  // Staff view — own active shift + history
  const [{ data: activeShift }, { data: shiftHistory }] = await Promise.all([
    supabase
      .from("staff_shifts")
      .select(`*, register:register_id(name, location)`)
      .eq("staff_id", user.id)
      .is("clock_out", null)
      .maybeSingle(),
    supabase
      .from("staff_shifts")
      .select(`*, register:register_id(name)`)
      .eq("staff_id", user.id)
      .order("clock_in", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="p-4 md:p-8">
      <ShiftsPage
        isAdmin={false}
        userId={user.id}
        userName={`${user.first_name} ${user.last_name}`}
        activeShift={(activeShift as any) ?? null}
        shifts={(shiftHistory ?? []) as any}
        registers={registers ?? []}
        staffList={[]}
      />
    </div>
  );
}

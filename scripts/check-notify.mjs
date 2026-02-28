import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Show all notifications from the last 24 hours
const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const { data: notifs, error } = await supabase
  .from("notifications")
  .select("id, user_id, type, title, created_at")
  .gte("created_at", since)
  .order("created_at", { ascending: false });

console.log("Notifications in last 24h:", notifs?.length ?? 0, error ?? "");
notifs?.forEach((n) =>
  console.log(
    ` - [${n.created_at}] user=${n.user_id} type=${n.type} title="${n.title}"`
  )
);

// Show all users and their roles
const { data: users } = await supabase
  .from("users")
  .select("id, email, role_id, roles(name)");
console.log("\nAll users:");
users?.forEach((u) =>
  console.log(` - ${u.email} | role=${u.roles?.name} | id=${u.id}`)
);

// --- Simulate notifyAdminAndActiveStaff ---
console.log("\n--- Simulating notifyAdminAndActiveStaff ---");

// Step 1: resolve admin role_id
const { data: adminRole, error: roleErr } = await supabase
  .from("roles")
  .select("id")
  .eq("name", "admin")
  .maybeSingle();
console.log("1. adminRole:", adminRole, roleErr ?? "");

// Step 2: get admin users by role_id
const { data: adminUsers, error: adminErr } = adminRole
  ? await supabase.from("users").select("id, email").eq("role_id", adminRole.id)
  : { data: [], error: null };
console.log("2. adminUsers:", adminUsers, adminErr ?? "");

// Step 3: get active staff shifts
const { data: activeShifts, error: shiftsErr } = await supabase
  .from("staff_shifts")
  .select("staff_id")
  .is("clock_out", null);
console.log("3. activeShifts:", activeShifts, shiftsErr ?? "");

// Step 4: build recipient map
const recipientMap = new Map();
for (const u of adminUsers ?? [])
  if (u.id) recipientMap.set(u.id, u.email ?? "");
for (const u of activeShifts ?? [])
  if (u.staff_id) recipientMap.set(u.staff_id, "");
console.log("4. recipient count:", recipientMap.size);

// Step 5: insert a test notification
if (recipientMap.size > 0) {
  const inserts = Array.from(recipientMap.keys()).map((userId) => ({
    user_id: userId,
    title: "SIMULATE: New Order TEST",
    message: "Simulation test insert",
    type: "new_order_sim",
    link: null,
  }));
  const { error: insertErr } = await supabase
    .from("notifications")
    .insert(inserts);
  console.log(
    "5. insert result:",
    insertErr ?? "SUCCESS - notifications inserted!"
  );
} else {
  console.log("5. SKIPPED — no recipients found");
}

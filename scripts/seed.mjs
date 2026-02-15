import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRoles() {
  console.log("🌱 Seeding roles...");

  const roles = [{ name: "admin" }, { name: "staff" }, { name: "customer" }];

  const { data: existingRoles } = await supabase.from("roles").select("name");

  if (existingRoles && existingRoles.length > 0) {
    console.log("✅ Roles already exist");
    return;
  }

  const { error } = await supabase.from("roles").insert(roles);

  if (error) {
    console.error("❌ Error seeding roles:", error.message);
  } else {
    console.log("✅ Roles seeded successfully");
  }
}

async function seedShopSettings() {
  console.log("🌱 Seeding shop settings...");

  const settings = [
    { key: "shop_name", value: { name: "Vapour Lounge" } },
    { key: "business_hours", value: { open: "09:00", close: "21:00" } },
    {
      key: "features",
      value: { reviews_enabled: true, age_gate_enabled: true },
    },
    {
      key: "categories",
      value: ["Vape Juice", "Devices", "Accessories", "Coils", "Batteries"],
    },
  ];

  const { data: existingSettings } = await supabase
    .from("shop_settings")
    .select("key");

  if (existingSettings && existingSettings.length > 0) {
    console.log("✅ Shop settings already exist");
    return;
  }

  const { error } = await supabase.from("shop_settings").insert(settings);

  if (error) {
    console.error("❌ Error seeding shop settings:", error.message);
  } else {
    console.log("✅ Shop settings seeded successfully");
  }
}

async function seedCashRegister() {
  console.log("🌱 Seeding cash register...");

  const { data: existing } = await supabase
    .from("cash_registers")
    .select("*")
    .limit(1)
    .single();

  if (existing) {
    console.log("✅ Cash register already exists");
    return;
  }

  const { error } = await supabase
    .from("cash_registers")
    .insert({ name: "Register 1", is_active: true });

  if (error) {
    console.error("❌ Error seeding cash register:", error.message);
  } else {
    console.log("✅ Cash register seeded successfully");
  }
}

async function main() {
  console.log("🚀 Starting database seed...\n");

  await seedRoles();
  await seedShopSettings();
  await seedCashRegister();

  console.log("\n✨ Seed completed!");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});

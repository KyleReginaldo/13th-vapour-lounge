import { ReturnsManagement } from "@/components/admin/returns/ReturnsManagement";
import { createClient } from "@/lib/supabase/server";

export default async function ReturnsPage() {
  const supabase = await createClient();

  const { data: returns, error } = await supabase
    .from("returns")
    .select(
      `
      *,
      customer:users!customer_id(first_name, last_name, email),
      order:order_id(id, order_number, total),
      processor:users!processed_by(first_name, last_name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching returns:", error);
  }

  return (
    <div className="p-4 md:p-8">
      <ReturnsManagement initialReturns={returns ?? []} />
    </div>
  );
}

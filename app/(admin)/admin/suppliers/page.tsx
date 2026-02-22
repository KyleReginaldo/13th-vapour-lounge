import { SuppliersManagement } from "@/components/admin/suppliers/SuppliersManagement";
import { createClient } from "@/lib/supabase/server";

export default async function SuppliersPage() {
  const supabase = await createClient();

  // Fetch suppliers from database
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");

  return (
    <div className="p-4 md:p-8">
      <SuppliersManagement initialSuppliers={suppliers || []} />
    </div>
  );
}

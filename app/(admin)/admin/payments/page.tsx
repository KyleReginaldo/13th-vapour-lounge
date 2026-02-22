import { PaymentVerification } from "@/components/admin/payments/PaymentVerification";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: proofs, error } = await supabase
    .from("payment_proofs")
    .select(
      `
      *,
      customer:users!customer_id(first_name, last_name, email),
      order:orders!order_id(id, order_number, total),
      verifier:users!verified_by(first_name, last_name)
    `
    )
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Error fetching payment proofs:", error);
  }

  return (
    <div className="p-4 md:p-8">
      <PaymentVerification initialProofs={proofs ?? []} />
    </div>
  );
}

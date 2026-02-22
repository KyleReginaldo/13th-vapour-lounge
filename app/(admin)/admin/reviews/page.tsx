import { ReviewManagement } from "@/components/admin/reviews/ReviewManagement";
import { createClient } from "@/lib/supabase/server";

export default async function ReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("product_reviews")
    .select(
      `*, user:users!user_id(first_name, last_name, email), product:product_id(id, name)`
    )
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Review Management</h1>
        <p className="text-muted-foreground">
          Moderate and manage customer product reviews
        </p>
      </div>
      <ReviewManagement initialReviews={reviews ?? []} />
    </div>
  );
}

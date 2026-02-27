import { getCategories } from "@/app/actions/categories-brands";
import { CategoriesManagement } from "@/components/admin/categories/CategoriesManagement";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const result = await getCategories();
  const categories = result.success ? (result.data ?? []) : [];

  return (
    <div className="p-4 md:p-8">
      <CategoriesManagement initialCategories={categories} />
    </div>
  );
}

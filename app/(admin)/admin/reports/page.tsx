import { ReportsAnalytics } from "@/components/admin/reports/ReportsAnalytics";
import { requireRole } from "@/lib/auth/roles";

export default async function ReportsPage() {
  await requireRole(["admin"]);

  return (
    <div className="p-8">
      <ReportsAnalytics />
    </div>
  );
}

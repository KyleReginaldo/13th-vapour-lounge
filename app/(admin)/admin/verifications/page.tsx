import { AgeVerificationManagement } from "@/components/admin/AgeVerificationManagement";
import { requireRole } from "@/lib/auth/roles";

export default async function VerificationsPage() {
  await requireRole(["admin"]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Age Verifications</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve customer ID submissions for age verification
        </p>
      </div>
      <AgeVerificationManagement />
    </div>
  );
}

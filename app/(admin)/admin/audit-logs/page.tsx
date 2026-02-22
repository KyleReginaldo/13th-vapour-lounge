import { AuditLogViewer } from "@/components/admin/audit/AuditLogViewer";
import { requireRole } from "@/lib/auth/supabase-auth";

export default async function AuditLogsPage() {
  await requireRole(["admin"]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor all system activities, changes, and critical actions
        </p>
      </div>

      <AuditLogViewer />
    </div>
  );
}

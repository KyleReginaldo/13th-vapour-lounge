import { getShopSettings } from "@/app/actions/settings";
import { SettingsPage as SettingsComponent } from "@/components/admin/settings/SettingsPage";
import { requireRole } from "@/lib/auth/roles";

export default async function SettingsPageWrapper() {
  await requireRole(["admin"]);
  const result = await getShopSettings();
  const settings = result?.success ? (result.data as Record<string, any>) : {};

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your store settings and preferences
        </p>
      </div>
      <SettingsComponent initialSettings={settings} />
    </div>
  );
}

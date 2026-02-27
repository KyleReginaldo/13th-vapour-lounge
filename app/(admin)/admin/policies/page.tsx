import { getAllPolicies } from "@/app/actions/policies";
import { PoliciesManager } from "@/components/admin/policies/PoliciesManager";
import type { PolicyData, PolicyKey } from "@/lib/policies";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const result = await getAllPolicies();
  const policies = result.success
    ? result.data!
    : ({} as Record<PolicyKey, PolicyData>);

  return (
    <div className="p-4 md:p-8">
      <PoliciesManager initialPolicies={policies} />
    </div>
  );
}

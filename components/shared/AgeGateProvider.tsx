"use client";

import { isFeatureEnabled } from "@/app/actions/feature-flags";
import { useQuery } from "@tanstack/react-query";
import { AgeGateModal } from "./AgeGateModal";

export function AgeGateProvider() {
  const { data: ageGateEnabled, isLoading } = useQuery({
    queryKey: ["feature-flag", "ageGateEnabled"],
    queryFn: async () => {
      const result = await isFeatureEnabled("ageGateEnabled");
      return result.success ? result.data : false;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return null;
  }

  return <AgeGateModal enabled={ageGateEnabled ?? false} />;
}

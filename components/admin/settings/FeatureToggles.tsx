"use client";

import {
  getFeatureFlags,
  updateFeatureFlags,
  type FeatureFlags,
} from "@/app/actions/feature-flags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Flag, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type FeatureConfig = {
  key: keyof FeatureFlags;
  label: string;
  description: string;
  critical?: boolean;
};

const features: FeatureConfig[] = [
  {
    key: "maintenanceMode",
    label: "Maintenance Mode",
    description: "Disable customer access for maintenance",
    critical: true,
  },
  {
    key: "onlineOrderingEnabled",
    label: "Online Ordering",
    description: "Allow customers to place orders online",
  },
  {
    key: "ageGateEnabled",
    label: "Age Gate",
    description: "Show age verification modal on restricted products",
  },
  {
    key: "ageVerificationRequired",
    label: "Age Verification Required",
    description: "Require uploaded ID verification for purchases",
  },
  {
    key: "reviewsEnabled",
    label: "Product Reviews",
    description: "Allow customers to submit product reviews",
  },
  {
    key: "posEnabled",
    label: "Point of Sale (POS)",
    description: "Enable in-store POS system for staff",
  },
  {
    key: "emailNotificationsEnabled",
    label: "Email Notifications",
    description: "Send email notifications for orders and updates",
  },
  {
    key: "lowStockAlertsEnabled",
    label: "Low Stock Alerts",
    description: "Send emails when inventory is low",
  },
  {
    key: "newUserRegistrationsEnabled",
    label: "New User Registrations",
    description: "Allow new customers to create accounts",
  },
  {
    key: "guestCheckoutEnabled",
    label: "Guest Checkout",
    description: "Allow checkout without creating an account",
  },
];

export function FeatureToggles() {
  const queryClient = useQueryClient();
  const [flags, setFlags] = useState<FeatureFlags | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const result = await getFeatureFlags();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch feature flags");
      }
      return result.data!;
    },
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (data) {
      setFlags(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (newFlags: Partial<FeatureFlags>) => {
      const result = await updateFeatureFlags(newFlags);
      if (!result.success) {
        throw new Error(result.error || "Failed to update feature flags");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success("Feature flags updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleToggle = (key: keyof FeatureFlags, value: boolean) => {
    if (!flags) return;

    // Update local state immediately
    setFlags({
      ...flags,
      [key]: value,
    });
  };

  const handleSave = () => {
    if (!flags) return;
    updateMutation.mutate(flags);
  };

  if (isLoading || !flags) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Toggles
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Feature Toggles
        </CardTitle>
        <CardDescription>
          Enable or disable features across your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Maintenance Mode Warning */}
        {flags.maintenanceMode && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 dark:text-yellow-200">
                  Maintenance Mode Active
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Customer access is currently disabled. Only admins and staff
                  can access the system.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature List */}
        <div className="space-y-4">
          {features.map((feature) => {
            const isEnabled = flags[feature.key];

            return (
              <div
                key={feature.key}
                className="flex items-start justify-between gap-4 pb-4 border-b last:border-0"
              >
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    id={feature.key}
                    checked={isEnabled}
                    onCheckedChange={(checked: boolean) =>
                      handleToggle(feature.key, checked)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={feature.key}
                        className="font-medium cursor-pointer"
                      >
                        {feature.label}
                      </Label>
                      {feature.critical && (
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      )}
                      <Badge
                        variant={isEnabled ? "default" : "outline"}
                        className="text-xs"
                      >
                        {isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

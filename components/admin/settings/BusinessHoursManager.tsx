"use client";

import {
  getBusinessHours,
  updateBusinessHours,
  type DaySchedule,
  type WeeklySchedule,
} from "@/app/actions/business-hours";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function BusinessHoursManager() {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const result = await getBusinessHours();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch business hours");
      }
      return result.data!;
    },
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (data) {
      setSchedule(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (newSchedule: WeeklySchedule) => {
      const result = await updateBusinessHours(newSchedule);
      if (!result.success) {
        throw new Error(result.error || "Failed to update business hours");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      toast.success("Business hours updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDayChange = (
    day: keyof WeeklySchedule,
    field: keyof DaySchedule,
    value: any
  ) => {
    if (!schedule) return;

    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [field]: value,
      },
    });
  };

  const handleSave = () => {
    if (!schedule) return;
    updateMutation.mutate(schedule);
  };

  const days: Array<{ key: keyof WeeklySchedule; label: string }> = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  if (isLoading || !schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours
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
          <Clock className="h-5 w-5" />
          Business Hours
        </CardTitle>
        <CardDescription>
          Set your store's operating hours for each day of the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {days.map(({ key, label }) => {
            const daySchedule = schedule[key];

            return (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b last:border-0"
              >
                {/* Day name and open toggle */}
                <div className="flex items-center gap-3 sm:w-48">
                  <Checkbox
                    checked={daySchedule.isOpen}
                    onCheckedChange={(checked: boolean) =>
                      handleDayChange(key, "isOpen", checked)
                    }
                  />
                  <Label className="font-medium">{label}</Label>
                </div>

                {/* Time inputs */}
                {daySchedule.isOpen ? (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Open
                      </Label>
                      <Input
                        type="time"
                        value={daySchedule.openTime}
                        onChange={(e) =>
                          handleDayChange(key, "openTime", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Close
                      </Label>
                      <Input
                        type="time"
                        value={daySchedule.closeTime}
                        onChange={(e) =>
                          handleDayChange(key, "closeTime", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Closed</div>
                )}
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

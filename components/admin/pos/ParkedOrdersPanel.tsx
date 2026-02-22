"use client";

import { getParkedOrders, restoreParkedOrder } from "@/app/actions/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowDownToLine, Clock } from "lucide-react";
import { toast } from "sonner";

type ParkedOrdersPanelProps = {
  onRestoreOrder: (cartData: any) => void;
};

export function ParkedOrdersPanel({ onRestoreOrder }: ParkedOrdersPanelProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["parked-orders"],
    queryFn: async () => {
      const result = await getParkedOrders();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch parked orders");
      }
      return result.data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const restoreMutation = useMutation({
    mutationFn: async (parkedId: string) => {
      const result = await restoreParkedOrder(parkedId);
      if (!result.success) {
        throw new Error(result.error || "Failed to restore order");
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["parked-orders"] });
      onRestoreOrder(data.cart_data);
      toast.success("Order restored to cart");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleRestore = (parkedId: string) => {
    restoreMutation.mutate(parkedId);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Parked Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const parkedOrders = data || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Parked Orders
        </CardTitle>
        <CardDescription>
          {parkedOrders.length} order{parkedOrders.length !== 1 ? "s" : ""} on
          hold
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {parkedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No parked orders</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4">
              {parkedOrders.map((order: any) => {
                const items = order.cart_data || [];
                const itemCount = items.length;
                const total = items.reduce(
                  (sum: number, item: any) =>
                    sum + (item.price || 0) * (item.quantity || 0),
                  0
                );

                return (
                  <div
                    key={order.id}
                    className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(order.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {order.customer_name && (
                          <p className="text-sm font-medium">
                            {order.customer_name}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {order.notes}
                          </p>
                        )}
                        <p className="text-sm font-semibold mt-1">
                          {formatCurrency(total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleRestore(order.id)}
                        disabled={restoreMutation.isPending}
                      >
                        <ArrowDownToLine className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

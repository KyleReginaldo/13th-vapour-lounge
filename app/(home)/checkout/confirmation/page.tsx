"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Home, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) {
        router.push("/");
        return;
      }

      const supabase = createClient();

      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      if (orderError || !orderData) {
        console.error("Order not found:", orderError);
        router.push("/");
        return;
      }

      // Load order items
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderData.id);

      setOrder(orderData);
      setOrderItems(itemsData || []);
      setIsLoading(false);
    }

    loadOrder();
  }, [orderNumber, router]);

  if (isLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const paymentMethodLabel = order.payment_method?.replace(/_/g, " ") || "N/A";

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        {/* Success Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We&apos;ve received your order and will
            process it shortly.
          </p>
        </div>

        {/* Order Number */}
        <div className="mb-8 rounded-lg border bg-muted/50 p-6 text-center">
          <p className="mb-1 text-sm text-muted-foreground">Order Number</p>
          <p className="text-2xl font-bold">{order.order_number}</p>
        </div>

        {/* Order Details Card */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">Order Details</h2>

          {/* Order Items */}
          <div className="mb-6 space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{item.product_name}</p>
                  {item.variant_attributes && (
                    <p className="text-sm text-muted-foreground">
                      {Object.entries(
                        (item.variant_attributes as Record<string, string>) ||
                          {}
                      )
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {(order.shipping_cost ?? 0) === 0
                  ? "FREE"
                  : formatCurrency(order.shipping_cost ?? 0)}
              </span>
            </div>

            {order.discount && order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          {/* Shipping Address */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Shipping Address</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.shipping_full_name}</p>
              <p className="text-muted-foreground">{order.shipping_phone}</p>
              <p className="text-muted-foreground">
                {order.shipping_address_line1}
                {order.shipping_address_line2 &&
                  `, ${order.shipping_address_line2}`}
              </p>
              <p className="text-muted-foreground">
                {order.shipping_city}, {order.shipping_postal_code}
              </p>
              <p className="text-muted-foreground">{order.shipping_country}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Payment Method</h3>
            <div className="space-y-2 text-sm">
              <p className="capitalize">{paymentMethodLabel}</p>
              <div
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  order.payment_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : order.payment_status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {order.payment_status === "paid"
                  ? "Paid"
                  : order.payment_status === "pending"
                    ? "Pending Verification"
                    : "Unpaid"}
              </div>
              {order.payment_status === "pending" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  We&apos;ll verify your payment within 1-2 business days.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-8 rounded-lg border bg-blue-50 p-6">
          <h3 className="mb-3 font-semibold text-blue-900">
            What&apos;s Next?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>
                You&apos;ll receive an email confirmation at your registered
                email address.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>
                {order.payment_status === "pending"
                  ? "Once your payment is verified, we'll start processing your order."
                  : "We'll start processing your order and prepare it for shipment."}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>
                Track your order status in your account under &quot;My
                Orders&quot;.
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/profile?tab=orders">
              <Package className="mr-2 h-4 w-4" />
              View My Orders
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

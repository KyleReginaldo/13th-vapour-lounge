import { getOrderTracking, type OrderTracking } from "@/app/actions/profile";
import { getCurrentUser } from "@/lib/auth/supabase-auth";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  PackageSearch,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}): Promise<Metadata> {
  const { orderId } = await params;
  const { data } = await getOrderTracking(orderId);
  if (!data) return { title: "Order Not Found" };
  return {
    title: `Order ${data.order_number} | 13th Vapour Lounge`,
    description: `Track your order ${data.order_number}`,
  };
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    key: "placed",
    label: "Order Placed",
    Icon: ShoppingBag,
    description: "We've received your order",
  },
  {
    key: "payment",
    label: "Payment Confirmed",
    Icon: CreditCard,
    description: "Payment successfully verified",
  },
  {
    key: "processing",
    label: "Preparing",
    Icon: Package,
    description: "Your items are being packed",
  },
  {
    key: "shipped",
    label: "On its Way",
    Icon: Truck,
    description: "Your order has been shipped",
  },
  {
    key: "delivered",
    label: "Delivered",
    Icon: CheckCircle2,
    description: "Your order has arrived",
  },
] as const;

function getStepIndex(order: OrderTracking): number {
  // returns index of the CURRENT active step (0-based)
  const status = order.status ?? "";
  const paid =
    order.payment_status === "paid" ||
    !!order.paid_at ||
    ["processing", "shipped", "delivered", "completed"].includes(status);

  if (status === "delivered" || status === "completed") return 4; // all done
  if (status === "shipped" || !!order.shipped_at) return 3; // shipped active
  if (status === "processing") return paid ? 2 : 1;
  if (paid) return 1; // pending but paid
  return 0; // just placed
}

type StepStatus = "done" | "active" | "pending";

function stepStatus(stepIdx: number, currentIdx: number): StepStatus {
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function fmtShort(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { orderId } = await params;
  const { data: order, error: orderError } = await getOrderTracking(orderId);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F0F0] flex items-center justify-center mx-auto mb-4">
            <PackageSearch className="h-7 w-7 text-[#ADADAD]" />
          </div>
          <h1 className="text-[18px] font-bold text-[#0A0A0A]">
            Order not found
          </h1>
          <p className="text-[13px] text-[#888] mt-2 mb-6">
            {orderError === "Not authenticated."
              ? "Please sign in to view your order."
              : "This order doesn't exist or doesn't belong to your account."}
          </p>
          <Link
            href="/profile?tab=orders"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#0A0A0A] px-4 py-2.5 rounded-xl hover:bg-[#1A1A1A] transition-colors"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentIdx = isCancelled ? -1 : getStepIndex(order);

  const stepTimestamps: Record<string, string | null> = {
    placed: order.created_at,
    payment: order.paid_at,
    processing: null,
    shipped: order.shipped_at,
    delivered: order.delivered_at ?? order.completed_at,
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back + header */}
        <div>
          <Link
            href="/profile?tab=orders"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#0A0A0A] transition-colors mb-4"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7L9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Orders
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold text-[#0A0A0A] tracking-tight">
                Order {order.order_number}
              </h1>
              <p className="text-[13px] text-[#888] mt-0.5">
                Placed {fmt(order.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[order.status ?? "pending"] ?? "bg-gray-100 text-gray-600"}`}
              >
                {order.status ?? "—"}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${PAYMENT_STYLES[order.payment_status ?? "pending"] ?? "bg-gray-100 text-gray-600"}`}
              >
                {order.payment_status ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-red-700">
                Order Cancelled
              </p>
              <p className="text-[13px] text-red-600 mt-0.5">
                This order was cancelled on {fmtShort(order.cancelled_at)}.
                {order.payment_status === "paid" &&
                  " A refund should be processed shortly."}
              </p>
            </div>
          </div>
        )}

        {/* Step tracker */}
        {!isCancelled && (
          <div className="rounded-2xl border border-[#EBEBEB] bg-white px-6 py-6">
            <h2 className="text-[13px] font-semibold text-[#0A0A0A] uppercase tracking-wider mb-6">
              Order Status
            </h2>

            {/* Desktop: horizontal */}
            <div className="hidden sm:flex items-start relative">
              {/* connecting line */}
              <div className="absolute top-[18px] left-[calc(10%+8px)] right-[calc(10%+8px)] h-[2px] bg-[#EBEBEB]" />
              {/* filled progress line */}
              {currentIdx > 0 && (
                <div
                  className="absolute top-[18px] left-[calc(10%+8px)] h-[2px] bg-[#0A0A0A] transition-all duration-500"
                  style={{
                    width: `calc(${(currentIdx / (STEPS.length - 1)) * 80}% - ${(currentIdx / (STEPS.length - 1)) * 16}px)`,
                  }}
                />
              )}

              {STEPS.map((step, idx) => {
                const state: StepStatus =
                  currentIdx >= STEPS.length
                    ? "done"
                    : stepStatus(idx, currentIdx);
                const ts = stepTimestamps[step.key];
                return (
                  <div
                    key={step.key}
                    className="flex-1 flex flex-col items-center relative z-10"
                  >
                    {/* Circle */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        state === "done"
                          ? "bg-[#0A0A0A] border-[#0A0A0A]"
                          : state === "active"
                            ? "bg-white border-[#0A0A0A]"
                            : "bg-white border-[#DEDEDE]"
                      }`}
                    >
                      {state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <step.Icon
                          className={`h-4 w-4 ${
                            state === "active"
                              ? "text-[#0A0A0A]"
                              : "text-[#CDCDCD]"
                          }`}
                        />
                      )}
                    </div>
                    <p
                      className={`mt-2 text-[11px] font-semibold text-center leading-tight ${
                        state === "pending"
                          ? "text-[#ADADAD]"
                          : "text-[#0A0A0A]"
                      }`}
                    >
                      {step.label}
                    </p>
                    {ts && state !== "pending" && (
                      <p className="mt-0.5 text-[10px] text-[#ADADAD] text-center leading-tight">
                        {fmtShort(ts)}
                      </p>
                    )}
                    {state === "active" && !ts && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                        <Clock className="h-2.5 w-2.5" /> In progress
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile: vertical timeline */}
            <div className="sm:hidden space-y-0">
              {STEPS.map((step, idx) => {
                const state: StepStatus =
                  currentIdx >= STEPS.length
                    ? "done"
                    : stepStatus(idx, currentIdx);
                const ts = stepTimestamps[step.key];
                const isLast = idx === STEPS.length - 1;
                return (
                  <div key={step.key} className="flex gap-3">
                    {/* left column: circle + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          state === "done"
                            ? "bg-[#0A0A0A] border-[#0A0A0A]"
                            : state === "active"
                              ? "bg-white border-[#0A0A0A]"
                              : "bg-white border-[#DEDEDE]"
                        }`}
                      >
                        {state === "done" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <step.Icon
                            className={`h-3.5 w-3.5 ${
                              state === "active"
                                ? "text-[#0A0A0A]"
                                : "text-[#CDCDCD]"
                            }`}
                          />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-[2px] flex-1 min-h-[24px] mt-1 ${
                            state === "done" ? "bg-[#0A0A0A]" : "bg-[#EBEBEB]"
                          }`}
                        />
                      )}
                    </div>
                    {/* right column: text */}
                    <div className={`${isLast ? "" : "pb-5"} pt-1`}>
                      <p
                        className={`text-[13px] font-semibold ${
                          state === "pending"
                            ? "text-[#ADADAD]"
                            : "text-[#0A0A0A]"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-[#ADADAD] mt-0.5">
                        {step.description}
                      </p>
                      {ts && state !== "pending" && (
                        <p className="text-[11px] text-[#888] mt-0.5">
                          {fmt(ts)}
                        </p>
                      )}
                      {state === "active" && !ts && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                          <Clock className="h-2.5 w-2.5" /> In progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tracking number */}
            {order.tracking_number && (
              <div className="mt-5 pt-5 border-t border-[#F0F0F0] flex items-center gap-3">
                <PackageSearch className="h-4 w-4 text-[#888] shrink-0" />
                <div>
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wide">
                    Tracking Number
                  </p>
                  <p className="text-[14px] font-semibold text-[#0A0A0A] font-mono mt-0.5">
                    {order.tracking_number}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Items + Notes + History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="rounded-2xl border border-[#EBEBEB] bg-white px-6 py-5">
              <h2 className="text-[13px] font-semibold text-[#0A0A0A] uppercase tracking-wider mb-4">
                Items ({order.items.length})
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    {/* Thumbnail or placeholder */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5F5F5] shrink-0 flex items-center justify-center">
                      {item.product_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-[#CDCDCD]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.product_slug ? (
                        <Link
                          href={`/products/${item.product_slug}`}
                          className="text-[13px] font-medium text-[#0A0A0A] hover:underline line-clamp-2 leading-snug"
                        >
                          {item.product_name}
                        </Link>
                      ) : (
                        <p className="text-[13px] font-medium text-[#0A0A0A] line-clamp-2 leading-snug">
                          {item.product_name}
                        </p>
                      )}
                      {item.variant_attributes &&
                        Object.keys(item.variant_attributes).length > 0 && (
                          <p className="text-[11px] text-[#ADADAD] mt-0.5">
                            {Object.entries(item.variant_attributes)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}
                          </p>
                        )}
                      <p className="text-[11px] text-[#ADADAD] mt-0.5">
                        ₱{item.unit_price.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-[#0A0A0A] shrink-0">
                      ₱{item.subtotal.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status history */}
            {order.statusHistory.length > 0 && (
              <div className="rounded-2xl border border-[#EBEBEB] bg-white px-6 py-5">
                <h2 className="text-[13px] font-semibold text-[#0A0A0A] uppercase tracking-wider mb-4">
                  Activity Log
                </h2>
                <div className="space-y-0">
                  {order.statusHistory.map((h, idx) => {
                    const isLast = idx === order.statusHistory.length - 1;
                    return (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0A0A0A] shrink-0 mt-1" />
                          {!isLast && (
                            <div className="w-[1px] flex-1 min-h-[20px] bg-[#EBEBEB] my-1" />
                          )}
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[12px] font-semibold text-[#0A0A0A] capitalize">
                              {h.to_status.replace(/_/g, " ")}
                            </p>
                            {h.from_status && (
                              <span className="text-[10px] text-[#ADADAD]">
                                from {h.from_status.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          {h.notes && (
                            <p className="text-[12px] text-[#666] mt-0.5">
                              {h.notes}
                            </p>
                          )}
                          <p className="text-[11px] text-[#ADADAD] mt-0.5">
                            {fmt(h.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customer notes */}
            {order.customer_notes && (
              <div className="rounded-2xl border border-[#EBEBEB] bg-white px-6 py-5">
                <h2 className="text-[13px] font-semibold text-[#0A0A0A] uppercase tracking-wider mb-2">
                  Order Notes
                </h2>
                <p className="text-[13px] text-[#666] leading-relaxed">
                  {order.customer_notes}
                </p>
              </div>
            )}
          </div>

          {/* Right: Shipping + Summary */}
          <div className="space-y-6">
            {/* Shipping address */}
            {order.shipping_full_name && (
              <div className="rounded-2xl border border-[#EBEBEB] bg-white px-5 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-[#888]" />
                  <h2 className="text-[13px] font-semibold text-[#0A0A0A] uppercase tracking-wider">
                    Delivery Address
                  </h2>
                </div>
                <div className="space-y-0.5 text-[13px] text-[#444]">
                  <p className="font-medium text-[#0A0A0A]">
                    {order.shipping_full_name}
                  </p>
                  {order.shipping_phone && (
                    <p className="text-[12px] text-[#888]">
                      {order.shipping_phone}
                    </p>
                  )}
                  <p>{order.shipping_address_line1}</p>
                  {order.shipping_address_line2 && (
                    <p>{order.shipping_address_line2}</p>
                  )}
                  <p>
                    {[
                      order.shipping_city,
                      order.shipping_postal_code,
                      order.shipping_country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="rounded-2xl border border-[#EBEBEB] bg-white px-5 py-5">
              <h2 className="text-[13px] font-semibold text-[#0A0A0A] uppercase tracking-wider mb-3">
                Order Summary
              </h2>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-[#666]">
                  <span>Subtotal</span>
                  <span>₱{order.subtotal.toLocaleString()}</span>
                </div>
                {order.shipping_cost !== null &&
                  order.shipping_cost !== undefined && (
                    <div className="flex justify-between text-[#666]">
                      <span>Shipping</span>
                      <span>
                        {order.shipping_cost === 0
                          ? "Free"
                          : `₱${order.shipping_cost.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                {order.discount !== null &&
                  order.discount !== undefined &&
                  order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₱{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-[#666]">
                    <span>Tax</span>
                    <span>₱{order.tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-[#F0F0F0] pt-2 flex justify-between font-bold text-[15px] text-[#0A0A0A]">
                  <span>Total</span>
                  <span>₱{order.total.toLocaleString()}</span>
                </div>
                <div className="mt-1 text-[11px] text-[#ADADAD] flex justify-between">
                  <span>Payment</span>
                  <span className="capitalize">
                    {order.payment_method?.replace(/_/g, " ") ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Back to profile */}
            <Link
              href="/profile?tab=orders"
              className="block w-full text-center rounded-xl border border-[#E8E8E8] bg-white hover:bg-[#F7F7F7] transition-colors px-4 py-2.5 text-[13px] font-medium text-[#444]"
            >
              ← Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

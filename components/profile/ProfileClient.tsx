"use client";

import {
  changePassword,
  updateProfile,
  type ProfileOrder,
} from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UserWithRole } from "@/lib/auth/supabase-auth";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  Lock,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useFormStatus } from "react-dom";

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-green-50 text-green-700 border-green-200",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-gray-50 text-gray-700 border-gray-200",
};

function StatusBadge({
  value,
  styleMap,
}: {
  value: string | null;
  styleMap: Record<string, string>;
}) {
  if (!value) return null;
  const cls = styleMap[value] ?? "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        cls
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

function SaveButton({ label = "Save Changes" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-10 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white rounded-xl disabled:opacity-60"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "orders" | "settings";

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: UserCircle },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "settings", label: "Settings", icon: KeyRound },
];

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ user }: { user: UserWithRole }) {
  const fullName = [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ");
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  const fields = [
    {
      icon: User,
      label: "Full Name",
      value: `${fullName}${user.suffix ? `, ${user.suffix}` : ""}`,
    },
    { icon: User, label: "Email", value: user.email },
    { icon: Phone, label: "Contact Number", value: user.contact_number },
    {
      icon: Calendar,
      label: "Date of Birth",
      value: new Date(user.date_of_birth).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
    { icon: ShieldCheck, label: "Role", value: user.roles?.name ?? "customer" },
    {
      icon: Calendar,
      label: "Member Since",
      value: user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
          })
        : "—",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Avatar card */}
      <div className="flex items-center gap-4 rounded-2xl bg-[#0A0A0A] p-6 text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold">{fullName}</p>
          <p className="text-sm text-white/50">{user.email}</p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium capitalize text-white/70">
            <ShieldCheck className="h-3 w-3" />
            {user.roles?.name ?? "customer"}
          </span>
        </div>
      </div>

      {/* Detail fields */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-white divide-y divide-[#F5F5F5] overflow-hidden">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5]">
              <Icon className="h-4 w-4 text-[#888]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#ADADAD] uppercase tracking-wide">
                {label}
              </p>
              <p className="text-[14px] font-medium text-[#0F0F0F] truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders }: { orders: ProfileOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E0E0E0] bg-white py-16 text-center">
        <Package className="h-12 w-12 text-[#D0D0D0] mb-3" />
        <p className="font-medium text-[#3D3D3D]">No orders yet</p>
        <p className="text-sm text-[#ADADAD] mt-1 mb-5">
          Your order history will appear here.
        </p>
        <Link href="/products">
          <Button className="rounded-xl bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]">
            Start shopping <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden"
        >
          {/* Order header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F5F5F5]">
            <div>
              <p className="text-[13px] font-semibold text-[#0F0F0F]">
                {order.order_number}
              </p>
              <p className="text-[12px] text-[#ADADAD]">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={order.status} styleMap={STATUS_STYLES} />
              <StatusBadge
                value={order.payment_status}
                styleMap={PAYMENT_STATUS_STYLES}
              />
            </div>
          </div>

          {/* Items */}
          <div className="divide-y divide-[#F5F5F5]">
            {order.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#0F0F0F] truncate">
                    {item.product_name}
                  </p>
                  {item.variant_attributes && (
                    <p className="text-[11px] text-[#ADADAD]">
                      {Object.entries(item.variant_attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-medium text-[#0F0F0F]">
                    ₱{item.subtotal.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-[#ADADAD]">
                    qty {item.quantity}
                  </p>
                </div>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="px-5 py-2.5">
                <p className="text-[12px] text-[#ADADAD]">
                  +{order.items.length - 3} more item
                  {order.items.length - 3 > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 bg-[#FAFAFA] border-t border-[#F0F0F0]">
            <div className="flex items-center gap-1.5 text-[12px] text-[#ADADAD]">
              <CreditCard className="h-3.5 w-3.5" />
              {order.payment_method?.replace(/_/g, " ") ?? "—"}
            </div>
            <p className="text-[14px] font-semibold text-[#0F0F0F]">
              Total: ₱{order.total.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ user }: { user: UserWithRole }) {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const inputCls =
    "h-10 text-[14px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] focus-visible:border-[#0A0A0A] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all";

  return (
    <div className="space-y-6">
      {/* Edit profile */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5F5F5]">
          <p className="font-semibold text-[#0F0F0F] text-[15px]">
            Edit Profile
          </p>
          <p className="text-[13px] text-[#ADADAD]">
            Update your personal information
          </p>
        </div>
        <form action={updateProfile} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="firstName"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user.first_name}
                required
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="lastName"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user.last_name}
                required
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="middleName"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Middle Name
              </Label>
              <Input
                id="middleName"
                name="middleName"
                defaultValue={user.middle_name ?? ""}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="suffix"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Suffix
              </Label>
              <Input
                id="suffix"
                name="suffix"
                defaultValue={user.suffix ?? ""}
                placeholder="Jr., Sr., III"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="contactNumber"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Contact Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  defaultValue={user.contact_number}
                  required
                  className={cn(inputCls, "pl-9")}
                />
              </div>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <SaveButton label="Save Profile" />
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5F5F5]">
          <p className="font-semibold text-[#0F0F0F] text-[15px]">
            Change Password
          </p>
          <p className="text-[13px] text-[#ADADAD]">Keep your account secure</p>
        </div>
        <form action={changePassword} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="currentPassword"
              className="text-[13px] font-medium text-[#3D3D3D]"
            >
              Current Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPw ? "text" : "password"}
                required
                className={cn(inputCls, "pl-9 pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADADAD] hover:text-[#3D3D3D] transition-colors text-xs"
              >
                {showCurrentPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="newPassword"
              className="text-[13px] font-medium text-[#3D3D3D]"
            >
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPw ? "text" : "password"}
                minLength={6}
                required
                className={cn(inputCls, "pl-9 pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADADAD] hover:text-[#3D3D3D] transition-colors text-xs"
              >
                {showNewPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-[13px] font-medium text-[#3D3D3D]"
            >
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={cn(inputCls, "pl-9")}
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <SaveButton label="Change Password" />
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Alerts (reads URL params) ─────────────────────────────────────────────────

function Alerts() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <>
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-green-700">{message}</p>
        </div>
      )}
    </>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

export function ProfileClient({
  user,
  orders,
  defaultTab = "overview",
}: {
  user: UserWithRole;
  orders: ProfileOrder[];
  defaultTab?: Tab;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-3xl">
        {/* Alerts */}
        <Suspense fallback={null}>
          <Alerts />
        </Suspense>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F0F0F] tracking-tight">
            My Account
          </h1>
          <p className="text-[14px] text-[#ADADAD] mt-0.5">
            Manage your profile, orders and settings
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl bg-white border border-[#EBEBEB] p-1.5 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-all",
                activeTab === id
                  ? "bg-[#0A0A0A] text-white shadow-sm"
                  : "text-[#888] hover:text-[#0F0F0F]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab user={user} />}
        {activeTab === "orders" && <OrdersTab orders={orders} />}
        {activeTab === "settings" && <SettingsTab user={user} />}
      </div>
    </div>
  );
}

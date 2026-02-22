"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/supabase-auth";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 text-[14px] font-semibold bg-[#0A0A0A] hover:bg-[#1A1A1A] disabled:opacity-60 text-white rounded-xl border-0 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 transition-all duration-150"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in...
        </span>
      ) : (
        "Sign In"
      )}
    </Button>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex-1 flex flex-col">
      {/* Mobile logo */}
      <div className="lg:hidden p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#0A0A0A] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-[#0A0A0A] text-base">
            13th Vapour Lounge
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[400px]">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#0F0F0F] tracking-tight mb-1.5">
                Welcome back
              </h1>
              <p className="text-[14px] text-[#8A8A8A]">
                Sign in to continue shopping
              </p>
            </div>

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

            <form className="space-y-5" action={signIn}>
              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-[13px] font-medium text-[#3D3D3D]"
                >
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-[#ADADAD]" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="h-11 pl-9 pr-4 text-[14px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] focus-visible:border-[#0A0A0A] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-[13px] font-medium text-[#3D3D3D]"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-[12px] text-[#8A8A8A] hover:text-[#0A0A0A] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-[#ADADAD]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="h-11 pl-9 pr-10 text-[14px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] focus-visible:border-[#0A0A0A] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADADAD] hover:text-[#3D3D3D] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <SubmitButton />
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#F0F0F0]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[12px] text-[#C0C0C0]">
                  New to 13th Vapour Lounge?
                </span>
              </div>
            </div>

            <Link href="/sign-up">
              <Button
                variant="outline"
                className="w-full h-11 text-[14px] font-medium rounded-xl border-[1.5px] border-[#E8E8E8] text-[#3D3D3D] hover:bg-[#F5F5F5] hover:border-[#D0D0D0] transition-all"
              >
                Create an account
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-center text-[11px] text-[#C0C0C0]">
            Must be 18+ to purchase vape products
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left: Brand Panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative bg-[#0A0A0A] flex-col overflow-hidden">
        {/* Atmospheric glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/[0.03] blur-3xl" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-[400px] h-[400px] rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-white/[0.02] blur-2xl" />
        </div>

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0A0A0A]" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              13th Vapour Lounge
            </span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[12px] text-white/60 font-medium tracking-wide uppercase">
                  Trece Martires&apos; #1 Vape Shop
                </span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-4">
                Premium vapes,
                <br />
                <span className="text-white/40">your way.</span>
              </h2>
              <p className="text-[15px] text-white/50 leading-relaxed">
                Browse our curated selection of premium vape devices, pods, and
                accessories — all in one place.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                {
                  icon: Star,
                  label: "Curated selection",
                  sub: "Top brands, hand-picked",
                },
                {
                  icon: ShieldCheck,
                  label: "Age-verified",
                  sub: "18+ only, always safe",
                },
                {
                  icon: Zap,
                  label: "Fast checkout",
                  sub: "Order in minutes",
                },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white/80">
                      {label}
                    </p>
                    <p className="text-[12px] text-white/30">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-white/25">
            &copy; 2026 13th Vapour Lounge. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right: Form ───────────────────────────────────────────── */}
      <Suspense fallback={<div className="flex-1 bg-[#FAFAFA]" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}

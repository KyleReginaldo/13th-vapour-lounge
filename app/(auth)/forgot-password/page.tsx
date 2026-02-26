"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendPasswordResetOtp,
  updatePassword,
  verifyPasswordResetOtp,
} from "@/lib/auth/supabase-auth";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const INPUT_CLS =
  "h-11 text-[14px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] focus-visible:border-[#0A0A0A] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all";
const BTN_CLS =
  "w-full h-11 text-[14px] font-semibold bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white rounded-xl border-0 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0";

type Step = 1 | 2 | 3 | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Step 1: send OTP ─────────────────────────────────── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await sendPasswordResetOtp(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep(2);
  };

  /* ── Step 2: verify OTP ───────────────────────────────── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await verifyPasswordResetOtp(email, token);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep(3);
  };

  /* ── Step 3: set new password ─────────────────────────── */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep("done");
    setTimeout(() => {
      router.push("/sign-in?message=Password+reset+successfully");
    }, 2000);
  };

  /* ── OTP box handlers ─────────────────────────────────── */
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
      {/* Logo */}
      <div className="fixed top-6 left-6 md:top-8 md:left-8">
        <Link
          href="/"
          className="text-sm font-medium text-[#3D3D3D] hover:text-[#1A1A1A] transition-colors"
        >
          VAPOUR LOUNGE
        </Link>
      </div>

      <div className="w-full max-w-[420px] mt-[5vh]">
        <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-8 sm:p-10">
          {/* ── Step 1: Email ─────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0F0F0F] tracking-tight mb-1.5">
                  Reset password
                </h1>
                <p className="text-[14px] text-[#8A8A8A]">
                  Enter your email and we'll send a verification code.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSendOtp}>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-[13px] font-medium text-[#3D3D3D]"
                  >
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${INPUT_CLS} pl-10 pr-4`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-red-700">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className={BTN_CLS}>
                  {loading ? "Sending…" : "Send verification code"}
                </Button>

                <Link
                  href="/sign-in"
                  className="flex items-center justify-center gap-1.5 text-[13px] text-[#8A8A8A] hover:text-[#0A0A0A] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </form>
            </>
          )}

          {/* ── Step 2: OTP ───────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F5] mb-4">
                  <Mail className="h-5 w-5 text-[#0A0A0A]" />
                </div>
                <h1 className="text-2xl font-bold text-[#0F0F0F] tracking-tight mb-1.5">
                  Check your email
                </h1>
                <p className="text-[14px] text-[#8A8A8A]">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-[#0F0F0F]">{email}</span>.
                  Enter it below.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                {/* OTP boxes */}
                <div
                  className="flex gap-2 justify-between"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-full h-12 text-center text-[20px] font-semibold text-[#0F0F0F] border-[1.5px] border-[#E8E8E8] rounded-xl bg-white outline-none transition-all duration-150 focus:border-[#0A0A0A] focus:-translate-y-px focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] caret-transparent"
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-red-700">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className={BTN_CLS}>
                  {loading ? "Verifying…" : "Verify code"}
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(["", "", "", "", "", ""]);
                      setError("");
                    }}
                    className="text-[13px] text-[#8A8A8A] hover:text-[#0A0A0A] transition-colors"
                  >
                    Wrong email?
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setError("");
                      setLoading(true);
                      const r = await sendPasswordResetOtp(email);
                      setLoading(false);
                      if (r.error) setError(r.error);
                      else setOtp(["", "", "", "", "", ""]);
                    }}
                    className="text-[13px] text-[#8A8A8A] hover:text-[#0A0A0A] transition-colors disabled:opacity-40"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 3: New password ──────────────────────── */}
          {step === 3 && (
            <>
              <div className="mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F5] mb-4">
                  <KeyRound className="h-5 w-5 text-[#0A0A0A]" />
                </div>
                <h1 className="text-2xl font-bold text-[#0F0F0F] tracking-tight mb-1.5">
                  New password
                </h1>
                <p className="text-[14px] text-[#8A8A8A]">
                  Choose a strong password for your account.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleResetPassword}>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-[13px] font-medium text-[#3D3D3D]"
                  >
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${INPUT_CLS} pl-4 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1A1A1A] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-[13px] font-medium text-[#3D3D3D]"
                  >
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${INPUT_CLS} pl-4 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1A1A1A] transition-colors"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-red-700">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className={BTN_CLS}>
                  {loading ? "Saving…" : "Reset password"}
                </Button>
              </form>
            </>
          )}

          {/* ── Done ─────────────────────────────────────── */}
          {step === "done" && (
            <div className="py-4 text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle className="h-7 w-7 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F0F0F]">
                Password updated!
              </h1>
              <p className="text-[14px] text-[#8A8A8A]">
                Redirecting you to sign in…
              </p>
            </div>
          )}
        </div>

        {/* Step indicator */}
        {step !== "done" && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-6 bg-[#1A1A1A]"
                    : s < step
                      ? "w-6 bg-[#1A1A1A] opacity-30"
                      : "w-1.5 bg-[#E0E0E0]"
                }`}
              />
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-[12px] text-[#737373]">
          Secure password reset
        </p>
      </div>
    </div>
  );
}

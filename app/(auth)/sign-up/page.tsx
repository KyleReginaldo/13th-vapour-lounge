"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth/supabase-auth";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="flex-1 h-11 text-[14px] font-semibold bg-[#0A0A0A] hover:bg-[#1A1A1A] disabled:opacity-60 text-white rounded-xl border-0 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 transition-all duration-150"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating account...
        </span>
      ) : (
        "Create Account"
      )}
    </Button>
  );
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split("T")[0];

  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<string | null>(null);

  // Accumulated data from each step stored in state so it survives step transitions
  const [stepOneData, setStepOneData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    contactNumber: "",
    dateOfBirth: "",
  });
  const [stepTwoData, setStepTwoData] = useState({
    email: "",
    password: "",
  });

  const formRef = useRef<HTMLFormElement>(null);

  const inputCls =
    "h-11 text-[14px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] focus-visible:border-[#0A0A0A] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all";

  const readField = (name: string) =>
    (formRef.current?.elements.namedItem(name) as HTMLInputElement)?.value ??
    "";

  const handleContinueStep1 = () => {
    const firstName = readField("firstName");
    const lastName = readField("lastName");
    const contactNumber = readField("contactNumber");
    const dateOfBirth = readField("dateOfBirth");

    if (!firstName || !lastName || !contactNumber || !dateOfBirth) {
      setStepErrors("Please fill in all required fields.");
      return;
    }
    setStepErrors(null);
    setStepOneData({
      firstName,
      lastName,
      middleName: readField("middleName"),
      suffix: readField("suffix"),
      contactNumber,
      dateOfBirth,
    });
    setCurrentStep(2);
  };

  const handleContinueStep2 = () => {
    const email = readField("email");
    const password = readField("password");

    if (!email || !password) {
      setStepErrors("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setStepErrors("Password must be at least 6 characters.");
      return;
    }
    setStepErrors(null);
    setStepTwoData({ email, password });
    setCurrentStep(3);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA]">
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
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-8 sm:p-10">
            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-1.5">
                <h1 className="text-2xl font-bold text-[#0F0F0F] tracking-tight">
                  Create account
                </h1>
                <span className="text-[12px] font-medium text-[#ADADAD] bg-[#F5F5F5] px-2.5 py-0.5 rounded-full">
                  {currentStep} / 3
                </span>
              </div>
              <p className="text-[13px] text-[#8A8A8A] mb-4">
                {currentStep === 1
                  ? "Tell us about yourself"
                  : currentStep === 2
                    ? "Set up your credentials"
                    : "Almost there — review and confirm"}
              </p>

              {/* Progress bar */}
              <div className="flex gap-1.5">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      step <= currentStep ? "bg-[#0A0A0A]" : "bg-[#EBEBEB]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* URL-level error/success */}
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

            <form ref={formRef} className="space-y-4" action={signUp}>
              {/* Hidden fields carrying step 1 & 2 data when on step 3 */}
              {currentStep === 3 && (
                <>
                  <input
                    type="hidden"
                    name="firstName"
                    value={stepOneData.firstName}
                  />
                  <input
                    type="hidden"
                    name="lastName"
                    value={stepOneData.lastName}
                  />
                  <input
                    type="hidden"
                    name="middleName"
                    value={stepOneData.middleName}
                  />
                  <input
                    type="hidden"
                    name="suffix"
                    value={stepOneData.suffix}
                  />
                  <input
                    type="hidden"
                    name="contactNumber"
                    value={stepOneData.contactNumber}
                  />
                  <input
                    type="hidden"
                    name="dateOfBirth"
                    value={stepOneData.dateOfBirth}
                  />
                  <input type="hidden" name="email" value={stepTwoData.email} />
                  <input
                    type="hidden"
                    name="password"
                    value={stepTwoData.password}
                  />
                </>
              )}

              {/* Step 1: Personal */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="firstName"
                        className="text-[13px] font-medium text-[#3D3D3D]"
                      >
                        First name <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          placeholder="John"
                          defaultValue={stepOneData.firstName}
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="lastName"
                        className="text-[13px] font-medium text-[#3D3D3D]"
                      >
                        Last name <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          placeholder="Doe"
                          defaultValue={stepOneData.lastName}
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="middleName"
                        className="text-[13px] font-medium text-[#3D3D3D]"
                      >
                        Middle name
                      </Label>
                      <Input
                        id="middleName"
                        name="middleName"
                        type="text"
                        placeholder="Optional"
                        defaultValue={stepOneData.middleName}
                        className={`${inputCls} px-4`}
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
                        type="text"
                        placeholder="Jr., Sr."
                        defaultValue={stepOneData.suffix}
                        className={`${inputCls} px-4`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contactNumber"
                      className="text-[13px] font-medium text-[#3D3D3D]"
                    >
                      Contact number <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        type="tel"
                        placeholder="+63 912 345 6789"
                        defaultValue={stepOneData.contactNumber}
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="dateOfBirth"
                      className="text-[13px] font-medium text-[#3D3D3D]"
                    >
                      Date of birth <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        max={maxDateString}
                        defaultValue={stepOneData.dateOfBirth}
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                    <p className="text-[11px] text-[#ADADAD]">
                      You must be 18 years or older
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Account */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-[13px] font-medium text-[#3D3D3D]"
                    >
                      Email address <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        defaultValue={stepTwoData.email}
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="password"
                      className="text-[13px] font-medium text-[#3D3D3D]"
                    >
                      Password <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        minLength={6}
                        placeholder="At least 6 characters"
                        defaultValue={stepTwoData.password}
                        className={`${inputCls} pl-9 pr-10`}
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
                    <p className="text-[11px] text-[#ADADAD]">
                      Minimum 6 characters
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  {/* Summary card */}
                  <div className="rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] divide-y divide-[#EBEBEB] overflow-hidden text-[13px]">
                    <div className="px-4 py-2.5 flex gap-2">
                      <span className="text-[#ADADAD] w-28 shrink-0">Name</span>
                      <span className="font-medium text-[#0F0F0F]">
                        {stepOneData.firstName} {stepOneData.lastName}
                        {stepOneData.suffix ? `, ${stepOneData.suffix}` : ""}
                      </span>
                    </div>
                    <div className="px-4 py-2.5 flex gap-2">
                      <span className="text-[#ADADAD] w-28 shrink-0">
                        Email
                      </span>
                      <span className="font-medium text-[#0F0F0F] truncate">
                        {stepTwoData.email}
                      </span>
                    </div>
                    <div className="px-4 py-2.5 flex gap-2">
                      <span className="text-[#ADADAD] w-28 shrink-0">
                        Contact
                      </span>
                      <span className="font-medium text-[#0F0F0F]">
                        {stepOneData.contactNumber}
                      </span>
                    </div>
                    <div className="px-4 py-2.5 flex gap-2">
                      <span className="text-[#ADADAD] w-28 shrink-0">
                        Birthday
                      </span>
                      <span className="font-medium text-[#0F0F0F]">
                        {stepOneData.dateOfBirth}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="ageConfirm"
                        required
                        className="mt-0.5 h-4 w-4 rounded border-[#E0E0E0] accent-[#0A0A0A]"
                      />
                      <span className="text-[13px] text-[#6A6A6A] leading-relaxed">
                        I confirm that I am{" "}
                        <strong className="text-[#0A0A0A]">
                          18 years or older
                        </strong>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="termsConfirm"
                        required
                        className="mt-0.5 h-4 w-4 rounded border-[#E0E0E0] accent-[#0A0A0A]"
                      />
                      <span className="text-[13px] text-[#6A6A6A] leading-relaxed">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          className="font-medium text-[#0A0A0A] underline underline-offset-2"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy"
                          className="font-medium text-[#0A0A0A] underline underline-offset-2"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step validation error */}
              {stepErrors && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <p className="text-[12px] text-red-700">{stepErrors}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-2.5 pt-2">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStepErrors(null);
                      setCurrentStep(currentStep - 1);
                    }}
                    className="h-11 px-4 text-[14px] font-medium rounded-xl border-[1.5px] border-[#E8E8E8] text-[#3D3D3D] hover:bg-[#F5F5F5]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}

                {currentStep === 1 && (
                  <Button
                    type="button"
                    onClick={handleContinueStep1}
                    className="flex-1 h-11 text-[14px] font-semibold bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white rounded-xl border-0 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 transition-all duration-150"
                  >
                    Continue →
                  </Button>
                )}

                {currentStep === 2 && (
                  <Button
                    type="button"
                    onClick={handleContinueStep2}
                    className="flex-1 h-11 text-[14px] font-semibold bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white rounded-xl border-0 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 transition-all duration-150"
                  >
                    Continue →
                  </Button>
                )}

                {currentStep === 3 && <SubmitButton />}
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#F0F0F0]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[12px] text-[#C0C0C0]">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link href="/sign-in">
              <Button
                variant="outline"
                className="w-full h-11 text-[14px] font-medium rounded-xl border-[1.5px] border-[#E8E8E8] text-[#3D3D3D] hover:bg-[#F5F5F5] hover:border-[#D0D0D0] transition-all"
              >
                Sign in instead
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

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative bg-[#0A0A0A] flex-col overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-3xl" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-24 w-[450px] h-[450px] rounded-full bg-white/[0.03] blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-[300px] h-[300px] rounded-full bg-white/[0.02] blur-2xl" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0A0A0A]" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              13th Vapour Lounge
            </span>
          </Link>
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[12px] text-white/60 font-medium tracking-wide uppercase">
                  Join our community
                </span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-4">
                Create your
                <br />
                <span className="text-white/40">free account.</span>
              </h2>
              <p className="text-[15px] text-white/50 leading-relaxed">
                Get access to exclusive member deals, order tracking, and our
                full premium catalog.
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  icon: User,
                  label: "Personal info",
                  sub: "Name, contact & birthday",
                },
                {
                  icon: Mail,
                  label: "Account details",
                  sub: "Email & secure password",
                },
                {
                  icon: ShieldCheck,
                  label: "Confirm & create",
                  sub: "Review and agree to terms",
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
      <Suspense fallback={<div className="flex-1 bg-[#FAFAFA]" />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}

"use client";

import { LegalAcceptModal } from "@/components/shared/LegalModal";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/ui/icon-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
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
  ShieldCheck,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Logo from "../../../public/logo.jpg";

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

function checkPasswordStrength(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [contactValue, setContactValue] = useState("");

  const [termsScrolled, setTermsScrolled] = useState(false);
  const [privacyScrolled, setPrivacyScrolled] = useState(false);
  const termsCheckRef = useRef<HTMLInputElement>(null);
  const privacyCheckRef = useRef<HTMLInputElement>(null);

  function handleTermsAccepted() {
    setTermsScrolled(true);
    if (termsCheckRef.current) termsCheckRef.current.checked = true;
  }

  function handlePrivacyAccepted() {
    setPrivacyScrolled(true);
    if (privacyCheckRef.current) privacyCheckRef.current.checked = true;
  }

  const [stepOneData, setStepOneData] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return {
      firstName: "",
      lastName: "",
      middleName: "",
      suffix: "",
      contactNumber: "",
      dateOfBirth: d.toISOString().split("T")[0],
    };
  });
  const [stepTwoData, setStepTwoData] = useState({
    email: "",
    password: "",
  });

  const formRef = useRef<HTMLFormElement>(null);

  const readField = (name: string) =>
    (formRef.current?.elements.namedItem(name) as HTMLInputElement)?.value ??
    "";

  const handleContinueStep1 = () => {
    const firstName = readField("firstName");
    const lastName = readField("lastName");
    const dateOfBirth = readField("dateOfBirth");

    if (!firstName || !lastName || !contactValue || !dateOfBirth) {
      setStepErrors("Please fill in all required fields.");
      return;
    }
    if (!contactValue.startsWith("9")) {
      setStepErrors("Contact number must start with 9.");
      return;
    }
    if (contactValue.length !== 10) {
      setStepErrors("Contact number must be exactly 10 digits after +63.");
      return;
    }
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (age - (hasHadBirthdayThisYear ? 0 : 1) < 18) {
      setStepErrors("You must be at least 18 years old to register.");
      return;
    }
    setStepErrors(null);
    setStepOneData({
      firstName,
      lastName,
      middleName: readField("middleName"),
      suffix: readField("suffix"),
      contactNumber: "+63" + contactValue,
      dateOfBirth,
    });
    setCurrentStep(2);
  };

  const handleContinueStep2 = () => {
    const email = readField("email").toLowerCase().trim();
    const password = readField("password");

    if (!email || !password) {
      setStepErrors("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@(gmail|yahoo)\.com$/.test(email)) {
      setStepErrors(
        "Only @gmail.com and @yahoo.com email addresses are accepted."
      );
      return;
    }
    const strength = checkPasswordStrength(password);
    if (!strength.minLength) {
      setStepErrors("Password must be at least 8 characters.");
      return;
    }
    if (!strength.hasUppercase) {
      setStepErrors("Password must include at least one uppercase letter.");
      return;
    }
    if (!strength.hasLowercase) {
      setStepErrors("Password must include at least one lowercase letter.");
      return;
    }
    if (!strength.hasSpecial) {
      setStepErrors("Password must include at least one special character.");
      return;
    }

    setStepErrors(null);
    setStepTwoData({ email, password });
    setCurrentStep(3);
  };

  const pwStrength = checkPasswordStrength(passwordValue);

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA]">
      <div className="lg:hidden p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#0A0A0A] flex items-center justify-center">
            <Image
              src={Logo}
              alt="13th Vapour Lounge Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="font-semibold text-[#0A0A0A] text-base">
            13th Vapour Lounge
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-110">
          <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-8 sm:p-10">
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
              <div className="flex gap-1.5">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${step <= currentStep ? "bg-[#0A0A0A]" : "bg-[#EBEBEB]"}`}
                  />
                ))}
              </div>
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

            <form ref={formRef} className="space-y-4" action={signUp}>
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
                      <Label htmlFor="firstName">
                        First name <span className="text-red-400">*</span>
                      </Label>
                      <IconInput
                        icon={User}
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="John"
                        defaultValue={stepOneData.firstName}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">
                        Last name <span className="text-red-400">*</span>
                      </Label>
                      <IconInput
                        icon={User}
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        defaultValue={stepOneData.lastName}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="middleName">Middle name</Label>
                      <Input
                        id="middleName"
                        name="middleName"
                        type="text"
                        placeholder="Optional"
                        defaultValue={stepOneData.middleName}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="suffix">Suffix</Label>
                      <Input
                        id="suffix"
                        name="suffix"
                        type="text"
                        placeholder="Jr., Sr."
                        defaultValue={stepOneData.suffix}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contactNumber">
                      Contact number <span className="text-red-400">*</span>
                    </Label>
                    <PhoneInput
                      id="contactNumber"
                      name="contactNumberDisplay"
                      value={contactValue}
                      onChange={(digits) => setContactValue(digits)}
                    />
                    <p className="text-[11px] text-[#ADADAD]">
                      Must start with 9 — max 10 digits (e.g., 9171234567)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth">
                      Date of birth <span className="text-red-400">*</span>
                    </Label>
                    <IconInput
                      icon={Calendar}
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      defaultValue={stepOneData.dateOfBirth}
                      max={(() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() - 18);
                        return d.toISOString().split("T")[0];
                      })()}
                    />
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
                    <Label htmlFor="email">
                      Email address <span className="text-red-400">*</span>
                    </Label>
                    <IconInput
                      icon={Mail}
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@gmail.com"
                      defaultValue={stepTwoData.email}
                      style={{ textTransform: "lowercase" }}
                    />
                    <p className="text-[11px] text-[#ADADAD]">
                      Only @gmail.com and @yahoo.com are accepted
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">
                      Password <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD] pointer-events-none" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        minLength={8}
                        placeholder="Min 8 chars, uppercase, lowercase, special"
                        value={passwordValue}
                        onChange={(e) => setPasswordValue(e.target.value)}
                        className="pl-9 pr-10"
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
                    {passwordValue.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 pt-1">
                        {[
                          {
                            check: pwStrength.minLength,
                            label: "8+ characters",
                          },
                          {
                            check: pwStrength.hasUppercase,
                            label: "Uppercase letter",
                          },
                          {
                            check: pwStrength.hasLowercase,
                            label: "Lowercase letter",
                          },
                          {
                            check: pwStrength.hasSpecial,
                            label: "Special character",
                          },
                        ].map(({ check, label }) => (
                          <div
                            key={label}
                            className="flex items-center gap-1.5"
                          >
                            <div
                              className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${check ? "bg-green-500" : "bg-[#E8E8E8]"}`}
                            >
                              {check && (
                                <svg
                                  className="w-2 h-2 text-white"
                                  fill="none"
                                  viewBox="0 0 10 8"
                                >
                                  <path
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M1 4l2.5 2.5L9 1"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-[11px] ${check ? "text-green-600" : "text-[#ADADAD]"}`}
                            >
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {currentStep === 3 && (
                <div className="space-y-5">
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

                  <div className="space-y-4">
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

                    <div className="space-y-2">
                      <p className="text-[12px] text-[#ADADAD] mb-1">
                        Please read and accept the Terms of Service:
                      </p>
                      <LegalAcceptModal
                        type="terms"
                        accepted={termsScrolled}
                        onAccepted={handleTermsAccepted}
                        trigger={
                          <button
                            type="button"
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-[1.5px] text-[13px] transition-colors ${
                              termsScrolled
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-[#E8E8E8] bg-[#FAFAFA] text-[#6A6A6A] hover:border-[#0A0A0A]"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {termsScrolled ? (
                                <span className="text-green-500">✓</span>
                              ) : (
                                <span>📄</span>
                              )}
                              Terms of Service
                            </span>
                            <span className="text-[11px] text-[#ADADAD]">
                              {termsScrolled ? "Accepted" : "Click to read →"}
                            </span>
                          </button>
                        }
                      />
                      <label
                        className={`flex items-start gap-3 ${
                          termsScrolled
                            ? "cursor-pointer"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <input
                          ref={termsCheckRef}
                          type="checkbox"
                          name="termsConfirm"
                          required
                          disabled={!termsScrolled}
                          defaultChecked={false}
                          className="mt-0.5 h-4 w-4 rounded border-[#E0E0E0] accent-[#0A0A0A] disabled:cursor-not-allowed"
                        />
                        <span className="text-[13px] text-[#6A6A6A] leading-relaxed">
                          I agree to the{" "}
                          <LegalAcceptModal
                            type="terms"
                            accepted={termsScrolled}
                            onAccepted={handleTermsAccepted}
                            trigger={
                              <span className="font-medium text-[#0A0A0A] underline underline-offset-2 cursor-pointer">
                                Terms of Service
                              </span>
                            }
                          />
                          {!termsScrolled && (
                            <span className="ml-1 text-[11px] text-amber-600">
                              (read the document to enable)
                            </span>
                          )}
                        </span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[12px] text-[#ADADAD] mb-1">
                        Please read and accept the Privacy Policy:
                      </p>
                      <LegalAcceptModal
                        type="privacy"
                        accepted={privacyScrolled}
                        onAccepted={handlePrivacyAccepted}
                        trigger={
                          <button
                            type="button"
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-[1.5px] text-[13px] transition-colors ${
                              privacyScrolled
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-[#E8E8E8] bg-[#FAFAFA] text-[#6A6A6A] hover:border-[#0A0A0A]"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {privacyScrolled ? (
                                <span className="text-green-500">✓</span>
                              ) : (
                                <span>🔒</span>
                              )}
                              Privacy Policy
                            </span>
                            <span className="text-[11px] text-[#ADADAD]">
                              {privacyScrolled ? "Accepted" : "Click to read →"}
                            </span>
                          </button>
                        }
                      />
                      <label
                        className={`flex items-start gap-3 ${
                          privacyScrolled
                            ? "cursor-pointer"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <input
                          ref={privacyCheckRef}
                          type="checkbox"
                          name="privacyConfirm"
                          required
                          disabled={!privacyScrolled}
                          defaultChecked={false}
                          className="mt-0.5 h-4 w-4 rounded border-[#E0E0E0] accent-[#0A0A0A] disabled:cursor-not-allowed"
                        />
                        <span className="text-[13px] text-[#6A6A6A] leading-relaxed">
                          I agree to the{" "}
                          <LegalAcceptModal
                            type="privacy"
                            accepted={privacyScrolled}
                            onAccepted={handlePrivacyAccepted}
                            trigger={
                              <span className="font-medium text-[#0A0A0A] underline underline-offset-2 cursor-pointer">
                                Privacy Policy
                              </span>
                            }
                          />
                          {!privacyScrolled && (
                            <span className="ml-1 text-[11px] text-amber-600">
                              (read the document to enable)
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {stepErrors && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <p className="text-[12px] text-red-700">{stepErrors}</p>
                </div>
              )}

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
                    Continue <span aria-hidden="true">&rarr;</span>
                  </Button>
                )}
                {currentStep === 2 && (
                  <Button
                    type="button"
                    onClick={handleContinueStep2}
                    className="flex-1 h-11 text-[14px] font-semibold bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white rounded-xl border-0 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 transition-all duration-150"
                  >
                    Continue <span aria-hidden="true">&rarr;</span>
                  </Button>
                )}
                {currentStep === 3 && <SubmitButton />}
              </div>
            </form>

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
          <div className="absolute -top-40 -left-40 w-150 h-150 rounded-full bg-white/2 blur-3xl" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-24 w-112.5 h-112.5 rounded-full bg-white/3 blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-75 h-75 rounded-full bg-white/2 blur-2xl" />
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
            <div className="w-8 h-8 rounded-md bg-[#0A0A0A] flex items-center justify-center">
              <Image
                src={Logo}
                alt="13th Vapour Lounge Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              13th Vapour Lounge
            </span>
          </Link>
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 bg-white/6 border border-white/8 rounded-full px-3 py-1 mb-6">
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
                  <div className="w-9 h-9 rounded-lg bg-white/6 border border-white/8 flex items-center justify-center shrink-0">
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

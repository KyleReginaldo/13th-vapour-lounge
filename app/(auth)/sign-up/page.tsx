"use client";

import { signUp } from "@/lib/auth/supabase-auth";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SignUpPage() {
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split("T")[0];

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, name: "Personal Info", icon: User },
    { id: 2, name: "Account Details", icon: Lock },
    { id: 3, name: "Verification", icon: Check },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-linear-to-br from-orange-50 via-red-50 to-orange-100 relative">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-linear-to-br from-primary/20 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-linear-to-tl from-accent/20 to-transparent blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 relative items-center justify-center p-12">
        <div className="max-w-lg z-10">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-3 tracking-tight">
                Join Us
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Become part of the Vapour Lounge community
              </p>
            </div>

            {/* Progress Steps - Visual */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isComplete = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isComplete
                          ? "bg-linear-to-br from-primary to-accent shadow-lg"
                          : isCurrent
                            ? "bg-linear-to-br from-primary/20 to-accent/20 border-2 border-primary"
                            : "bg-white/50 border-2 border-border"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isComplete || isCurrent ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-semibold transition-colors ${
                          isComplete || isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.name}
                      </h3>
                      <div className="w-full bg-border rounded-full h-1.5 mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete
                              ? "w-full bg-linear-to-r from-primary to-accent"
                              : isCurrent
                                ? "w-1/2 bg-primary"
                                : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-8 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <p>Exclusive member discounts</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <p>Early access to new products</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <p>Rewards program benefits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Glass morphism card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
            {/* Mobile Steps Indicator */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        currentStep >= step.id
                          ? "bg-linear-to-br from-primary to-accent text-white"
                          : "bg-border text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          currentStep > step.id
                            ? "bg-linear-to-r from-primary to-accent"
                            : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Step {currentStep} of {steps.length}:{" "}
                {steps[currentStep - 1].name}
              </p>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Create Account
              </h2>
              <p className="text-sm text-muted-foreground">
                Join Vapour Lounge and start your journey
              </p>
            </div>

            <form className="space-y-4" action={signUp}>
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        First Name <span className="text-accent">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          onFocus={() => setFocusedInput("firstName")}
                          onBlur={() => setFocusedInput(null)}
                          className="w-full pl-10 pr-3 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                          placeholder="John"
                        />
                        {focusedInput === "firstName" && (
                          <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Last Name <span className="text-accent">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          onFocus={() => setFocusedInput("lastName")}
                          onBlur={() => setFocusedInput(null)}
                          className="w-full pl-10 pr-3 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                          placeholder="Doe"
                        />
                        {focusedInput === "lastName" && (
                          <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label
                        htmlFor="middleName"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Middle Name
                      </label>
                      <input
                        id="middleName"
                        name="middleName"
                        type="text"
                        onFocus={() => setFocusedInput("middleName")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full px-3 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                        placeholder="Optional"
                      />
                    </div>

                    <div className="relative">
                      <label
                        htmlFor="suffix"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Suffix
                      </label>
                      <input
                        id="suffix"
                        name="suffix"
                        type="text"
                        onFocus={() => setFocusedInput("suffix")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full px-3 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                        placeholder="Jr., Sr., III"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="contactNumber"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Contact Number <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="contactNumber"
                        name="contactNumber"
                        type="tel"
                        required
                        onFocus={() => setFocusedInput("contactNumber")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                        placeholder="+63 912 345 6789"
                      />
                      {focusedInput === "contactNumber" && (
                        <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="dateOfBirth"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Date of Birth <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        required
                        max={maxDateString}
                        onFocus={() => setFocusedInput("dateOfBirth")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 text-sm"
                      />
                      {focusedInput === "dateOfBirth" && (
                        <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      You must be 18 years or older
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Account Details */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="relative">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Email Address <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                        placeholder="you@example.com"
                      />
                      {focusedInput === "email" && (
                        <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Password <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      {focusedInput === "password" && (
                        <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Must be at least 6 characters
                    </p>
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Confirm Password <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        onFocus={() => setFocusedInput("confirmPassword")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                        placeholder="Re-enter your password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {focusedInput === "confirmPassword" && (
                        <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                      )}
                    </div>
                  </div>

                  {/* Password strength indicator */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-border">
                        <div className="h-full w-1/3 rounded-full bg-accent"></div>
                      </div>
                      <div className="h-1.5 flex-1 rounded-full bg-border"></div>
                      <div className="h-1.5 flex-1 rounded-full bg-border"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: Weak
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Terms & Verification */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-linear-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      Almost there!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Please review and accept our terms to complete your
                      registration.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer group p-3 rounded-lg hover:bg-primary/5 transition-colors">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        className="mt-0.5 w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all"
                      />
                      <span className="text-sm text-foreground">
                        I agree to the{" "}
                        <Link
                          href="#"
                          className="text-primary hover:text-primary/80 font-medium underline underline-offset-2"
                        >
                          Terms and Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="#"
                          className="text-primary hover:text-primary/80 font-medium underline underline-offset-2"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group p-3 rounded-lg hover:bg-primary/5 transition-colors">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all"
                      />
                      <span className="text-xs text-muted-foreground">
                        I want to receive marketing emails about new products
                        and exclusive offers
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group p-3 rounded-lg hover:bg-primary/5 transition-colors">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all"
                      />
                      <span className="text-xs text-muted-foreground">
                        I confirm that I am 18 years of age or older
                      </span>
                    </label>
                  </div>

                  {/* Trust badges */}
                  <div className="grid grid-cols-3 gap-3 pt-3">
                    <div className="text-center p-2.5 rounded-lg bg-white/50 border border-border">
                      <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        Secure
                      </p>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-white/50 border border-border">
                      <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        Protected
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/50 border border-border">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        Fast
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/20 font-medium text-foreground text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-linear-to-r from-primary to-accent text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/20 text-sm"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-linear-to-r from-primary to-accent text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/20 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Create Account
                  </button>
                )}
              </div>
            </form>

            {/* Sign in link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign in instead
              </Link>
            </p>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 Vapour Lounge. Premium vaping products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

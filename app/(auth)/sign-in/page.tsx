"use client";

import { signIn } from "@/lib/auth/supabase-auth";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex overflow-hidden bg-linear-to-br from-orange-50 via-red-50 to-orange-100 relative">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-linear-to-br from-primary/20 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-linear-to-tl from-accent/20 to-transparent blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="max-w-lg z-10">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-3 tracking-tight">
                Vapour Lounge
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Your premium destination for quality vaping products
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Premium Quality
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Curated selection of top-tier vaping products
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-accent/10 hover:border-accent/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-accent to-primary flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
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
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Fast Delivery
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Quick and reliable shipping to your doorstep
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Glass morphism card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to continue to your account
              </p>
            </div>

            <form className="space-y-4" action={signIn}>
              {/* Email Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                  placeholder="Email address"
                />
                {focusedInput === "email" && (
                  <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                )}
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white/50 border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {focusedInput === "password" && (
                  <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10 blur-lg" />
                )}
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="remember-me"
                    name="remember-me"
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all"
                  />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  href="#"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-linear-to-r from-primary to-accent text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/20 text-sm"
              >
                Sign In
              </button>
            </form>

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>

          {/* Mobile branding */}
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

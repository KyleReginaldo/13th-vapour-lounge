"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement password reset logic with Supabase
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
      {/* Logo - Top Left */}
      <div className="fixed top-6 left-6 md:top-8 md:left-8">
        <Link
          href="/"
          className="text-sm font-medium text-[#3D3D3D] hover:text-[#1A1A1A] transition-colors"
        >
          VAPOUR LOUNGE
        </Link>
      </div>

      {/* Centered Auth Card */}
      <div className="w-full max-w-[420px] mt-[5vh]">
        <div className="bg-white rounded-xl p-8 md:p-12 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
          {isSubmitted ? (
            <>
              {/* Success State */}
              <div className="mb-8">
                <div className="w-12 h-12 rounded-full bg-[#F3F3F3] flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-[#1A1A1A]" />
                </div>
                <h1 className="text-[28px] font-semibold tracking-tight text-[#0F0F0F] mb-2">
                  Check your email
                </h1>
                <p className="text-[15px] text-[#737373]">
                  We've sent a password reset link to your email address.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-[14px] text-[#737373]">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full h-11 text-[15px] font-semibold"
                >
                  Try again
                </Button>

                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className="w-full h-11 text-[15px] font-medium text-[#1A1A1A]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Form State */}
              <div className="mb-8">
                <h1 className="text-[28px] font-semibold tracking-tight text-[#0F0F0F] mb-2">
                  Reset password
                </h1>
                <p className="text-[15px] text-[#737373]">
                  Enter your email address and we'll send you a reset link.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email Field */}
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
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      className="h-11 pl-10 pr-4 text-[15px] border-[1.5px] border-[#E0E0E0] rounded bg-[rgba(0,0,0,0.01)] transition-all duration-[140ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:border-[#1A1A1A] focus-visible:bg-white focus-visible:-translate-y-px focus-visible:shadow-[0_0_0_4px_rgba(26,26,26,0.04),0_2px_8px_rgba(0,0,0,0.08)] focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 text-[15px] font-semibold tracking-wide bg-[#1A1A1A] text-white rounded border-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:bg-[#1A1A1A] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-[140ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  Send reset link
                </Button>

                {/* Back to Sign In */}
                <Link href="/sign-in">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-11 text-[15px] font-medium text-[#1A1A1A]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Button>
                </Link>
              </form>
            </>
          )}
        </div>

        {/* Trust Element */}
        <p className="mt-8 text-center text-[12px] text-[#737373]">
          Secure password reset
        </p>
      </div>
    </div>
  );
}

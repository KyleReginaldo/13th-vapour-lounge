"use client";

import {
  requestPasswordChangeOTP,
  verifyPasswordChangeOTP,
  type PasswordChangeState,
} from "@/app/actions/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  RotateCcw,
  Shield,
} from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-10 rounded-xl disabled:opacity-60"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Please wait…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

export function SecuritySettings() {
  // Two-step OTP password change
  const [requestState, requestAction] = useActionState<
    PasswordChangeState,
    FormData
  >(requestPasswordChangeOTP, { status: "idle" });
  const [verifyState, verifyAction] = useActionState<
    PasswordChangeState,
    FormData
  >(verifyPasswordChangeOTP, { status: "idle" });

  const otpStep = requestState.status === "otp_sent";
  const passwordChanged = verifyState.status === "success";

  // OTP digit boxes
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpBoxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) otpBoxRefs.current[index + 1]?.focus();
  };

  const handleOtpDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpBoxRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setOtpDigits(next);
    otpBoxRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Security & Access
          </CardTitle>
          <CardDescription>
            Manage security settings for your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-1">Change Password</div>
              <div className="text-sm text-muted-foreground mb-3">
                Update your admin account password
              </div>

              {passwordChanged ? (
                /* ── Success state ── */
                <div className="flex flex-col items-center gap-3 text-center py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="font-semibold">Password changed!</p>
                  <p className="text-sm text-muted-foreground">
                    Your password has been updated successfully.
                  </p>
                </div>
              ) : !otpStep ? (
                /* ── Step 1: Enter new passwords ── */
                <form action={requestAction} className="space-y-3">
                  {requestState.status === "error" && (
                    <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700">
                        {requestState.message}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-newPassword">New Password</Label>
                    <PasswordInput
                      id="admin-newPassword"
                      name="newPassword"
                      minLength={6}
                      required
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-confirmPassword">
                      Confirm New Password
                    </Label>
                    <PasswordInput
                      id="admin-confirmPassword"
                      name="confirmPassword"
                      required
                      placeholder="Repeat your password"
                    />
                  </div>
                  <div className="pt-1">
                    <SubmitButton label="Send Verification Code" />
                  </div>
                </form>
              ) : (
                /* ── Step 2: Enter OTP ── */
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                    <Mail className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-700">
                      A 6-digit verification code was sent to{" "}
                      <strong>
                        {requestState.status === "otp_sent"
                          ? requestState.email
                          : "your email"}
                      </strong>
                      . It expires in 10 minutes.
                    </p>
                  </div>

                  <form action={verifyAction} className="space-y-4">
                    {verifyState.status === "error" && (
                      <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700">
                          {verifyState.message}
                        </p>
                      </div>
                    )}
                    <input
                      type="hidden"
                      name="otp"
                      value={otpDigits.join("")}
                    />

                    <div className="space-y-2">
                      <Label>Verification Code</Label>
                      <div
                        className="flex gap-2 max-w-xs"
                        onPaste={handleOtpDigitPaste}
                      >
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              otpBoxRefs.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            autoFocus={i === 0}
                            onChange={(e) =>
                              handleOtpDigitChange(i, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpDigitKeyDown(i, e)}
                            className="w-full h-12 text-center text-[20px] font-semibold border-[1.5px] border-[#E8E8E8] rounded-xl bg-white outline-none transition-all duration-150 focus:border-[#0A0A0A] focus:-translate-y-px focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] caret-transparent"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Start over
                      </button>
                      <SubmitButton label="Verify & Change Password" />
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Active Sessions */}
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-1">Active Sessions</div>
              <div className="text-sm text-muted-foreground mb-3">
                Manage devices logged into your account
              </div>
              <div className="text-sm p-3 bg-muted rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Current Session</div>
                    <div className="text-muted-foreground">macOS · Chrome</div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function VerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="sticky top-16 md:top-32 z-40 bg-amber-500 text-white shadow-sm">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <p className="text-[13px] font-medium truncate">
            Your account is not age-verified yet.{" "}
            <Link
              href="/profile?tab=settings"
              className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
            >
              Verify your age now
            </Link>{" "}
            to unlock all products.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-0.5 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

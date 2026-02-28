"use client";

import { LogIn, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-amber-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            We&apos;ll Be Back Soon
          </h1>
          <p className="text-gray-500 text-[15px] leading-relaxed">
            We&apos;re currently performing scheduled maintenance to improve
            your experience. Please check back shortly.
          </p>
        </div>

        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>

        <p className="text-xs text-gray-400">
          If the issue persists, please contact us.
        </p>

        <div className="pt-4 border-t border-gray-200">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 mb-6 max-w-sm">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {error?.digest && (
            <p className="text-xs text-gray-400 mb-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

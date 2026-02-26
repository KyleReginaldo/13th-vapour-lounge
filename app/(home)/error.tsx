"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-gray-800">Something went wrong</h2>
      <p className="text-gray-500 max-w-md">
        We&apos;re having trouble loading this page. Please try again.
      </p>
      <Button
        onClick={reset}
        className="bg-orange-500 hover:bg-orange-600 text-white"
      >
        Try again
      </Button>
    </div>
  );
}

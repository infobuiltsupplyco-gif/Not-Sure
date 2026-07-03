"use client";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Something went sideways</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Nothing you did — a part of the app hit an unexpected error. Your data
        is safe. {error.digest ? `(ref: ${error.digest})` : null}
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}

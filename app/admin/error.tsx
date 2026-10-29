"use client";

import { ErrorState } from "@/components/data/states";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="This page could not be loaded"
      description="The database did not respond as expected. Try again, and check that the migrations have been run."
      onRetry={reset}
    />
  );
}

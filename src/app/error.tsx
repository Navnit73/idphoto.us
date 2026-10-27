"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** Recoverable error boundary for route segments. Details are logged server-side, never shown. */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  // Values thrown in Client Components may not be Error instances; only server errors carry a digest.
  const digest = error instanceof globalThis.Error && "digest" in error ? String(error.digest) : undefined;

  return (
    <Container className="flex flex-col items-start gap-6 pt-page pb-section">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-prose text-lg text-muted-foreground">
        Sorry — this page hit an unexpected error. Please try again. If it keeps happening, let us know through the{" "}
        <Link href="/contact" className="font-medium text-primary underline underline-offset-4 hover:text-primary-hover">
          contact page
        </Link>
        .
      </p>
      {digest && <p className="font-mono text-sm text-muted-foreground">Reference: {digest}</p>}
      {/* retry() re-fetches the segment; reset() would only re-render the same failed payload. */}
      <Button onClick={retry}>Try again</Button>
    </Container>
  );
}

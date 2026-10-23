"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** Recoverable error boundary for route segments. Details are logged server-side, never shown. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex flex-col items-start gap-6 py-section">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-prose text-lg text-muted-foreground">
        Sorry — this page hit an unexpected error. Please try again. If it keeps happening, let us know through the contact page.
      </p>
      {error.digest && <p className="font-mono text-sm text-muted-foreground">Reference: {error.digest}</p>}
      <Button onClick={reset}>Try again</Button>
    </Container>
  );
}

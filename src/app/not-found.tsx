import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <Container className="flex flex-col items-start gap-6 pt-page pb-section">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="max-w-prose text-lg text-muted-foreground">
        The link may be out of date, or the page may have moved. These are the most popular places to start:
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/#photo-tool" className={buttonVariants()}>
          Make a passport photo
        </Link>
        <Link href="/guide" className={buttonVariants({ variant: "outline" })}>
          Browse guides
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Home
        </Link>
      </div>
    </Container>
  );
}

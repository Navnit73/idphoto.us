"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { cn } from "@/lib/cn";

type NavLinkProps = React.ComponentProps<typeof Link> & { href: string };

/** A section is current on its own path and on every page under it (/guide matches /guide/x). */
export function isCurrentSection(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CurrentAwareLink({ href, className, ...props }: NavLinkProps) {
  const current = isCurrentSection(usePathname(), href);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(className, current && "font-medium text-foreground")}
      {...props}
    />
  );
}

/**
 * Header link that marks the section you're in with `aria-current` and a stronger style.
 * The pathname isn't known while dynamic routes prerender, so a plain link stands in until it is.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<Link {...props} />}>
      <CurrentAwareLink {...props} />
    </Suspense>
  );
}

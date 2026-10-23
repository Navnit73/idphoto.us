import type { Heading } from "@/lib/content/markdown";
import { cn } from "@/lib/cn";

/** Links to the page's H2s, with H3s nested beneath. H4s are left out to keep it scannable. */
export function TableOfContents({ headings, className }: { headings: Heading[]; className?: string }) {
  const items = headings.filter((heading) => heading.depth <= 3);
  if (items.length < 2) return null;

  return (
    <nav aria-labelledby="toc-heading" className={cn("rounded-lg border bg-surface p-5 text-sm", className)}>
      <p id="toc-heading" className="font-semibold">
        On this page
      </p>
      <ol className="mt-3 space-y-2">
        {items.map((heading) => (
          <li key={heading.id} className={cn(heading.depth === 3 && "pl-4")}>
            <a href={`#${heading.id}`} className="text-muted-foreground transition-colors hover:text-primary">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

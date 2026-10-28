import type { Heading } from "@/lib/content/markdown";
import { cn } from "@/lib/cn";

/** Links to the page's H2s, with H3s nested beneath. H4s are left out to keep it scannable. */
export function TableOfContents({ headings, className }: { headings: Heading[]; className?: string }) {
  const items = headings.filter((heading) => heading.depth <= 3);
  if (items.length < 2) return null;

  return (
    <nav aria-labelledby="toc-heading" className={cn("text-sm", className)}>
      <p id="toc-heading" className="font-semibold">
        On this page
      </p>
      <ol className="mt-4 space-y-1 border-l">
        {items.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "-ml-px block border-l border-transparent py-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-foreground",
                heading.depth === 3 ? "pl-8" : "pl-4",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

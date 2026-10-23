import type { Frontmatter } from "@/lib/content/schema";

export function Sources({ sources }: { sources: Frontmatter["sources"] }) {
  if (!sources.length) return null;

  return (
    <section aria-labelledby="sources-heading" className="rounded-lg border bg-surface p-5 sm:p-6">
      <h2 id="sources-heading" className="text-lg font-semibold">
        Sources
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Official references this page was checked against.</p>
      <ul className="mt-4 space-y-2 text-sm">
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4 hover:text-primary-hover">
              {source.title}
            </a>
            <span className="text-muted-foreground"> — {source.publisher}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

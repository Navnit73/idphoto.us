import type { Root } from "hast";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import Image from "next/image";
import Link from "next/link";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

import { cn } from "@/lib/cn";

const linkClass = "font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary-hover hover:decoration-primary-hover";

const components: Partial<Components> = {
  h2: (props) => <h2 {...props} className="mt-12 font-display text-2xl font-semibold tracking-tight text-balance first:mt-0" />,
  h3: (props) => <h3 {...props} className="mt-8 text-xl font-semibold text-balance" />,
  h4: (props) => <h4 {...props} className="mt-6 text-lg font-semibold" />,
  p: (props) => <p {...props} className="mt-4 first:mt-0" />,
  ul: (props) => <ul {...props} className="mt-4 list-disc space-y-2 pl-6 marker:text-muted-foreground" />,
  ol: (props) => <ol {...props} className="mt-4 list-decimal space-y-2 pl-6 marker:text-muted-foreground" />,
  li: (props) => <li {...props} className="pl-1" />,
  strong: (props) => <strong {...props} className="font-semibold text-foreground" />,
  hr: () => <hr className="my-10" />,
  blockquote: (props) => (
    <blockquote {...props} className="mt-6 rounded-lg border-l-4 border-primary bg-primary-subtle px-5 py-4 text-primary-subtle-foreground [&>p]:mt-2 [&>p:first-child]:mt-0" />
  ),
  a: ({ href = "", children, ...props }) => {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={linkClass}>
          {children}
        </Link>
      );
    }
    const external = /^https?:\/\//.test(href);
    return (
      <a {...props} href={href} className={linkClass} {...(external && { rel: "noopener noreferrer" })}>
        {children}
      </a>
    );
  },
  table: (props) => (
    <div role="region" aria-label="Scrollable table" tabIndex={0} className="mt-6 overflow-x-auto rounded-lg border">
      <table {...props} className="w-full border-collapse text-left text-sm" />
    </div>
  ),
  thead: (props) => <thead {...props} className="bg-surface" />,
  th: ({ style, ...props }) => <th {...props} scope="col" style={style} className="border-b px-4 py-3 font-semibold" />,
  td: ({ style, ...props }) => <td {...props} style={style} className="border-b px-4 py-3 align-top [tr:last-child_&]:border-b-0" />,
  code: ({ className, ...props }) => (
    <code {...props} className={cn("rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm", className)} />
  ),
  pre: (props) => <pre {...props} className="mt-6 overflow-x-auto rounded-lg bg-muted p-4 text-sm [&>code]:bg-transparent [&>code]:p-0" />,
  figure: (props) => <figure {...props} className="mt-8" />,
  figcaption: (props) => <figcaption {...props} className="mt-2 text-center text-sm text-muted-foreground" />,
  img: ({ src, alt, width, height }) => {
    const source = String(src);
    return (
      <Image
        src={source}
        alt={alt ?? ""}
        width={Number(width)}
        height={Number(height)}
        sizes="(min-width: 768px) 720px, 100vw"
        unoptimized={source.endsWith(".svg")}
        className="mx-auto h-auto max-w-full rounded-lg border bg-surface-raised"
      />
    );
  },
};

/** Renders a parsed Markdown tree as semantic, token-styled HTML. */
export function Markdown({ tree, className }: { tree: Root; className?: string }) {
  return <div className={cn("text-foreground", className)}>{toJsxRuntime(tree, { Fragment, jsx, jsxs, components })}</div>;
}

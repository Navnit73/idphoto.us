"use client";

import dynamic from "next/dynamic";

import type { WidgetName } from "@/lib/content/schema";
import { cn } from "@/lib/cn";
import type { CountryCode } from "@/lib/photo/countries";

/**
 * Painted for one frame before the server-rendered widget is revealed, so it
 * takes the same space as the widget's first state to avoid a layout shift.
 */
function WidgetLoading({ className }: { className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center rounded-xl bg-surface text-sm text-muted-foreground", className)}>
      Loading…
    </div>
  );
}

/** The photo tools open on the file drop zone (see FileDrop). */
const ToolLoading = () => <WidgetLoading className="min-h-56 border-2 border-dashed border-border-strong" />;
const FormLoading = () => <WidgetLoading className="min-h-80 border" />;
/** Country picker plus drop zone, inside a padded card. */
const EditorLoading = () => <WidgetLoading className="min-h-96 border" />;

/** Options a page passes through frontmatter. Each widget reads only the ones it understands. */
type WidgetProps = { country?: CountryCode };

/**
 * Interactive widgets a Markdown page can embed with `widget: <name>`.
 * Each is code-split so a page only downloads the widget it uses. This module
 * must stay a Client Component: `next/dynamic` called from a Server Component
 * doesn't code-split, which would ship every widget to every content page.
 */
const widgets: Record<WidgetName, React.ComponentType<WidgetProps>> = {
  "photo-compressor": dynamic(() => import("@/components/tools/photo-compressor").then((m) => m.PhotoCompressor), {
    loading: ToolLoading,
  }),
  "photo-editor": dynamic(() => import("@/components/tools/photo-editor").then((m) => m.PhotoEditor), {
    loading: EditorLoading,
  }),
  "contact-form": dynamic(() => import("@/components/widgets/contact-form").then((m) => m.ContactForm), {
    loading: FormLoading,
  }),
};

export function Widget({ name, ...props }: { name: WidgetName } & WidgetProps) {
  const Component = widgets[name];
  return <Component {...props} />;
}

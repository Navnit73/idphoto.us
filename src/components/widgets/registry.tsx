"use client";

import dynamic from "next/dynamic";

import type { WidgetName } from "@/lib/content/schema";
import { cn } from "@/lib/cn";

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

/** Both photo tools open on the file drop zone (see FileDrop). */
const ToolLoading = () => <WidgetLoading className="min-h-56 border-2 border-dashed border-border-strong" />;
const FormLoading = () => <WidgetLoading className="min-h-80 border" />;

/**
 * Interactive widgets a Markdown page can embed with `widget: <name>`.
 * Each is code-split so a page only downloads the widget it uses. This module
 * must stay a Client Component: `next/dynamic` called from a Server Component
 * doesn't code-split, which would ship every widget to every content page.
 */
const widgets: Record<WidgetName, React.ComponentType> = {
  "passport-photo-maker": dynamic(() => import("@/components/tools/passport-photo-maker").then((m) => m.PassportPhotoMaker), {
    loading: ToolLoading,
  }),
  "photo-compressor": dynamic(() => import("@/components/tools/photo-compressor").then((m) => m.PhotoCompressor), {
    loading: ToolLoading,
  }),
  "contact-form": dynamic(() => import("@/components/widgets/contact-form").then((m) => m.ContactForm), {
    loading: FormLoading,
  }),
};

export function Widget({ name }: { name: WidgetName }) {
  const Component = widgets[name];
  return <Component />;
}

import dynamic from "next/dynamic";

import type { WidgetName } from "@/lib/content/schema";

function WidgetLoading() {
  return (
    <div role="status" className="flex min-h-80 items-center justify-center rounded-xl border bg-surface text-sm text-muted-foreground">
      Loading tool…
    </div>
  );
}

/**
 * Interactive widgets a Markdown page can embed with `widget: <name>`.
 * Each is code-split so a page only downloads the widget it uses.
 */
const widgets: Record<WidgetName, React.ComponentType> = {
  "passport-photo-maker": dynamic(() => import("@/components/tools/passport-photo-maker").then((m) => m.PassportPhotoMaker), {
    loading: WidgetLoading,
  }),
  "photo-compressor": dynamic(() => import("@/components/tools/photo-compressor").then((m) => m.PhotoCompressor), {
    loading: WidgetLoading,
  }),
  "contact-form": dynamic(() => import("@/components/widgets/contact-form").then((m) => m.ContactForm), {
    loading: WidgetLoading,
  }),
};

export function Widget({ name }: { name: WidgetName }) {
  const Component = widgets[name];
  return <Component />;
}

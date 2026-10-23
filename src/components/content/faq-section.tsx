import type { Page } from "@/lib/content/loader";

import { Markdown } from "./markdown";

/** Questions and answers are always visible (not collapsed), matching the FAQPage structured data. */
export function FaqSection({ faq, title = "Frequently asked questions" }: { faq: Page["faq"]; title?: string }) {
  if (!faq.length) return null;

  return (
    <section aria-labelledby="faq-heading" className="flex flex-col gap-6">
      <h2 id="faq-heading" className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="divide-y rounded-lg border bg-surface-raised">
        {faq.map((item) => (
          <div key={item.question} className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-balance">{item.question}</h3>
            <Markdown tree={item.answer} className="mt-2 text-muted-foreground" />
          </div>
        ))}
      </div>
    </section>
  );
}

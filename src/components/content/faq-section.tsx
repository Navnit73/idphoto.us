import { PlusIcon } from "@/components/home/icons";

import type { Page } from "@/lib/content/loader";

import { Markdown } from "./markdown";

/** Native `<details>` accordion, styled like the home page FAQ. Answers stay in the HTML, so FAQPage data still matches. */
export function FaqSection({ faq, title = "Frequently asked questions" }: { faq: Page["faq"]; title?: string }) {
  if (!faq.length) return null;

  return (
    <section aria-labelledby="faq-heading" className="flex flex-col gap-6">
      <h2 id="faq-heading" className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="divide-y rounded-lg border bg-surface-raised">
        {faq.map((item) => (
          <details key={item.question} className="group px-5 sm:px-6">
            <summary className="flex list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
              <h3 className="text-base font-medium text-balance">{item.question}</h3>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-all group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground">
                <PlusIcon className="size-4" />
              </span>
            </summary>
            <Markdown tree={item.answer} className="pr-10 pb-5 text-sm text-muted-foreground" />
          </details>
        ))}
      </div>
    </section>
  );
}

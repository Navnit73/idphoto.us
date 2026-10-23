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
      <div className="flex flex-col gap-3">
        {faq.map((item) => (
          <details key={item.question} className="group rounded-xl border bg-surface-raised open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-5 [&::-webkit-details-marker]:hidden">
              <h3 className="text-base font-semibold text-balance sm:text-lg">{item.question}</h3>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-open:rotate-45">
                <PlusIcon className="size-4" />
              </span>
            </summary>
            <Markdown tree={item.answer} className="-mt-1 px-5 pb-5 text-muted-foreground" />
          </details>
        ))}
      </div>
    </section>
  );
}

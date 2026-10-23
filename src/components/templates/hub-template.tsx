import { Markdown } from "@/components/content/markdown";
import { PageCardList } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { CameraIcon, ShieldIcon } from "@/components/home/icons";
import { Container } from "@/components/ui/container";
import type { WidgetName } from "@/lib/content/schema";

import type { TemplateProps } from "./types";

const WIDGET_ICONS: Partial<Record<WidgetName, typeof CameraIcon>> = {
  "photo-editor": CameraIcon,
  "contact-form": ShieldIcon,
};

function CardIcon({ widget }: { widget?: WidgetName }) {
  const Icon = widget && WIDGET_ICONS[widget];
  if (!Icon) return null;
  return (
    <span className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
      <Icon className="size-6" />
    </span>
  );
}

/** Category landing page (e.g. /tool): intro copy plus every page in the category. */
export function HubTemplate({ page, crumbs, categoryPages }: TemplateProps) {
  return (
    <Container className="pt-page pb-10 sm:pb-14">
      <div className="flex flex-col gap-12">
        <PageHeader page={page} crumbs={crumbs} />
        <section aria-labelledby="hub-list-heading" className="flex flex-col gap-6">
          <h2 id="hub-list-heading" className="sr-only">
            All {page.breadcrumbLabel.toLowerCase()}
          </h2>
          <PageCardList
            pages={categoryPages}
            showCategory={false}
            icon={(card) => <CardIcon widget={card.widget} />}
            className="lg:gap-6"
          />
        </section>
        <Markdown tree={page.tree} className="mx-auto w-full max-w-prose border-t pt-12 sm:pt-16" />
      </div>
    </Container>
  );
}

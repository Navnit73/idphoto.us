import type { TemplateName } from "@/lib/content/schema";

import { FaqTemplate } from "./faq-template";
import { GuideTemplate } from "./guide-template";
import { HubTemplate } from "./hub-template";
import { InfoTemplate } from "./info-template";
import { LegalTemplate } from "./legal-template";
import { ToolTemplate } from "./tool-template";
import type { TemplateProps } from "./types";

/** Maps a page's `template` frontmatter to the layout that renders it. */
export const templates: Record<TemplateName, React.ComponentType<TemplateProps>> = {
  tool: ToolTemplate,
  guide: GuideTemplate,
  faq: FaqTemplate,
  legal: LegalTemplate,
  info: InfoTemplate,
  hub: HubTemplate,
};

export type { TemplateProps };

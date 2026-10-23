import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-surface">
      <Container className="flex flex-col gap-2 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-foreground">{siteConfig.name}</p>
        <p>Not affiliated with the U.S. Department of State or any government agency.</p>
      </Container>
    </footer>
  );
}

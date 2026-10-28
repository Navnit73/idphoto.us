import { cn } from "@/lib/cn";

/** Small label above a heading, led by a short rule. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-sm font-semibold text-primary", className)}>
      <span aria-hidden="true" className="h-px w-5 bg-primary" />
      {children}
    </p>
  );
}

type SectionHeadingProps = {
  /** Id for the H2, so the section can use `aria-labelledby`. */
  id: string;
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
};

export function SectionHeading({ id, eyebrow, title, children, align = "center", className }: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={cn("font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl", eyebrow && "mt-4")}
      >
        {title}
      </h2>
      {children && <p className="mt-4 text-base text-pretty text-muted-foreground">{children}</p>}
    </div>
  );
}

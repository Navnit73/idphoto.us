import { cn } from "@/lib/cn";

// `group` lets a trailing arrow icon nudge right on hover.
const base =
  "group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  /** The premium tier's action (Expert edit), on the contrast tile. */
  premium: "bg-premium-bright text-premium-foreground hover:bg-premium-bright-hover",
  /** Download actions: buying and getting the photo file. */
  download: "bg-download text-download-foreground hover:bg-download-hover",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
  outline: "border border-border-strong bg-background text-foreground hover:border-muted-foreground hover:bg-surface",
  ghost: "text-foreground hover:bg-muted",
  /** For use on a `bg-primary` band. */
  inverse: "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
  "inverse-outline": "border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/** Button classes, for styling links or other elements as buttons. */
export function buttonVariants({ variant = "primary", size = "md", className }: ButtonStyleProps = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & ButtonStyleProps) {
  return <button type={type} className={buttonVariants({ variant, size, className })} {...props} />;
}

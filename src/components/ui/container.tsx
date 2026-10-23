import { cn } from "@/lib/cn";

/** Centers content at the site's max width with responsive side gutters. */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-content px-gutter", className)} {...props} />;
}

import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-ring focus-visible:outline-offset-0 aria-invalid:border-danger disabled:opacity-50";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => React.ReactNode;
};

/** Label, control, hint, and error message wired together for screen readers. */
export function Field({ id, label, hint, errors, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": errorId ? true : undefined, "aria-describedby": describedBy })}
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {errorId && (
        <p id={errorId} className="text-sm text-danger">
          {errors![0]}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-32", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(control, "h-10", className)} {...props} />;
}

type AlertProps = {
  tone: "success" | "danger" | "warning";
  children: React.ReactNode;
  className?: string;
  /**
   * Move focus here when it appears. For client widgets whose result replaces
   * the control that had focus, so keyboard and screen reader users land on it.
   */
  focus?: boolean;
};

const tones = {
  success: "border-success/40 bg-success-subtle",
  danger: "border-danger/40 bg-danger-subtle",
  warning: "border-warning/40 bg-warning-subtle",
};

const focusOnMount = (element: HTMLElement | null) => element?.focus();

export function Alert({ tone, children, className, focus = false }: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      tabIndex={focus ? -1 : undefined}
      ref={focus ? focusOnMount : undefined}
      className={cn("rounded-md border px-4 py-3 text-sm", tones[tone], className)}
    >
      {children}
    </div>
  );
}

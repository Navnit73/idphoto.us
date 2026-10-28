"use client";

import { CrownIcon, LockIcon, ScanFaceIcon, UserRoundCheckIcon, WandSparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ArrowRightIcon, CheckIcon, DownloadIcon, MailIcon, ShieldIcon, XIcon } from "@/components/home/icons";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";
import { siteConfig } from "@/config/site";
import type { CreateOrderConflict, CreateOrderResult } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { publicEnv } from "@/lib/env/public";
import { apiPost, ClientApiError } from "@/lib/http/client";
import { getTimezoneCurrency, isSupportedCurrency, type CurrencyCode } from "@/lib/payments/currency";
import { getPlanPricing, type PlanType } from "@/lib/payments/pricing";

const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Short line under each plan title, always visible (features collapse on mobile)
const PLAN_TAGLINES: Record<PlanType, string> = {
  standard: "Instant download, sized to official requirements",
  expert_edit: "A photo specialist reviews and retouches it by hand",
};

/** One curve for every themed color change; off when the visitor prefers reduced motion. */
const FADE =
  "transition-[color,background-color,border-color,box-shadow,opacity] duration-300 ease-standard motion-reduce:transition-none";

// Important, so it wins over Button's own `transition-colors` (cn doesn't merge classes).
const BUTTON_MOTION =
  "transition-[color,background-color,transform]! duration-300! ease-standard active:scale-[0.98] motion-reduce:transition-none!";

/** Two labels in one cell, cross-faded, so swapping copy doesn't jump. The hidden one is skipped by screen readers. */
function CrossFade({
  show,
  on,
  off,
  className,
}: {
  show: boolean;
  on: React.ReactNode;
  off: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("grid", className)}>
      <span aria-hidden={show || undefined} className={cn("col-start-1 row-start-1", FADE, show ? "opacity-0" : "opacity-100")}>
        {off}
      </span>
      <span aria-hidden={!show || undefined} className={cn("col-start-1 row-start-1", FADE, show ? "opacity-100" : "opacity-0")}>
        {on}
      </span>
    </span>
  );
}

type IconComponent = React.ComponentType<{ className?: string; "aria-hidden"?: "true" }>;

// Expert edit features, in the order pricing.ts lists them, each with its own icon.
const EXPERT_ICONS: IconComponent[] = [CheckIcon, UserRoundCheckIcon, WandSparklesIcon, MailIcon];

type Assurance = { Icon: IconComponent; title: string; detail: string };

const STANDARD_ASSURANCES: Assurance[] = [
  { Icon: DownloadIcon, title: "Instant download", detail: "full-resolution JPG" },
  { Icon: MailIcon, title: "Emailed to you", detail: "with your invoice" },
  { Icon: ShieldIcon, title: "Refund if rejected", detail: "by a government agency" },
];

const EXPERT_ASSURANCES: Assurance[] = [
  { Icon: ScanFaceIcon, title: "Reviewed by a person", detail: "not only software" },
  { Icon: WandSparklesIcon, title: "Retouched by hand", detail: "final version emailed" },
  { Icon: ShieldIcon, title: "Refund if rejected", detail: "by a government agency" },
];

// The timezone never changes while the page is open
const noSubscribe = () => () => {};

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (resp: unknown) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

let razorpayScript: Promise<boolean> | null = null;

/** Load Razorpay's checkout script once; concurrent callers share the request, and a failed load can be retried. */
function loadRazorpayScript(): Promise<boolean> {
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve(true);
  razorpayScript ??= new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      script.remove();
      razorpayScript = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return razorpayScript;
}

/** Razorpay's modal takes a literal color; read Action Blue from the design tokens. */
const brandColor = () => getComputedStyle(document.documentElement).getPropertyValue("--blue").trim() || undefined;

const thankYouPath = (id: string, paymentId: string) => `/preview/${id}/thank-you?paymentId=${paymentId}`;

export function CheckoutPanel({
  id,
  initialCurrency,
  geoDetected,
  description,
}: {
  id: string;
  /** Currency resolved on the server from the country header */
  initialCurrency: CurrencyCode;
  /** False when the request had no country header: fall back to the browser's timezone */
  geoDetected: boolean;
  description: string;
}) {
  const router = useRouter();
  // Set when create-order reports a different regional price
  const [serverCurrency, setServerCurrency] = useState<CurrencyCode | null>(null);
  // No country header (e.g. local dev): guess from the browser's timezone. The server applies
  // the same rule from the timeZone sent with the order. Server render uses initialCurrency.
  const tzCurrency = useSyncExternalStore(
    noSubscribe,
    () => (geoDetected ? null : getTimezoneCurrency(browserTimeZone())),
    () => null,
  );
  const currency = serverCurrency ?? tzCurrency ?? initialCurrency;
  const [plan, setPlan] = useState<PlanType>("standard");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogEmailRef = useRef<HTMLInputElement>(null);

  // Fetch the checkout script once the page is idle, so Pay opens the modal without waiting on it
  useEffect(() => {
    const preload = () => void loadRazorpayScript();
    if (typeof requestIdleCallback === "function") {
      const handle = requestIdleCallback(preload, { timeout: 3000 });
      return () => cancelIdleCallback(handle);
    }
    const timer = setTimeout(preload, 1500);
    return () => clearTimeout(timer);
  }, []);

  const plans = { standard: getPlanPricing("standard", currency), expert_edit: getPlanPricing("expert_edit", currency) };

  const isExpert = plan === "expert_edit";
  const selected = plans[plan];
  const emailValid = EMAIL_RE.test(email.trim());

  function openEmailDialog() {
    if (pending) return;
    setError("");
    dialogRef.current?.showModal();
    dialogEmailRef.current?.focus();
  }

  // Desktop button: pay straight away when the inline email is filled in, else ask for it
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (emailValid) void pay();
    else openEmailDialog();
  }

  function handleDialogSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    dialogRef.current?.close();
    void pay();
  }

  async function pay() {
    setError("");
    setPending(true);
    const targetEmail = email.trim().toLowerCase();

    try {
      // 1. Load Razorpay's checkout script (usually already preloaded) while the server
      // creates the order (amount is set server-side). expectedCurrency/expectedAmount let
      // the server refuse to charge a price we didn't show.
      const [scriptLoaded, order] = await Promise.all([
        loadRazorpayScript(),
        apiPost<CreateOrderResult>("/payments/create-order", {
          email: targetEmail,
          resultId: id,
          planType: plan,
          timeZone: browserTimeZone(),
          expectedCurrency: selected.currency,
          expectedAmount: selected.amountInSubunits,
        }),
      ]);
      if (!scriptLoaded) throw new Error("Unable to load the payment gateway. Please check your connection.");
      const { paymentId, razorpayOrderId, amount, currency, keyId } = order;

      // 3. Open Razorpay Checkout
      const Razorpay = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
      const rzp = new Razorpay({
        key: keyId || publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: siteConfig.name,
        description: isExpert ? `${description} + Expert edit` : description,
        image: siteConfig.logo,
        order_id: razorpayOrderId,
        prefill: { email: targetEmail },
        notes: { paymentId, resultId: id, planType: plan },
        theme: { color: brandColor() },
        modal: { ondismiss: () => setPending(false) },
        handler: async (response: RazorpayResponse) => {
          try {
            // 4. Verify payment on server, then show the thank-you page
            await apiPost("/payments/verify", {
              paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            router.push(thankYouPath(id, paymentId));
          } catch (verifyErr) {
            setPending(false);
            setError(
              verifyErr instanceof Error
                ? `${verifyErr.message} If you were charged, your photo will still be emailed to you.`
                : "Payment was received but verification had an issue. Please contact support.",
            );
          }
        },
      });

      // Razorpay keeps its modal open so the customer can retry; pending is cleared on dismiss,
      // otherwise the Pay button could open a second checkout on top
      rzp.on("payment.failed", (resp) => {
        const desc = (resp as { error?: { description?: string } })?.error?.description;
        setError(desc || "Payment was not completed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      const conflict = err instanceof ClientApiError && err.code === "conflict" ? (err.details as CreateOrderConflict) : null;
      // Already bought (e.g. a stale tab): show the existing order instead of charging again
      if (conflict?.reason === "already_paid" && conflict.paidPaymentId) {
        router.push(thankYouPath(id, conflict.paidPaymentId));
        return;
      }
      // Regional price differs from what this page shows: switch to the server's currency
      if (conflict?.reason === "price_changed" && isSupportedCurrency(conflict.currency)) {
        setServerCurrency(conflict.currency);
      }
      setPending(false);
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    }
  }

  const spinner = <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
  const payIcon = pending ? spinner : isExpert ? <CrownIcon aria-hidden="true" className="size-4" /> : <LockIcon aria-hidden="true" className="size-4" />;
  const errorMessage = error && <Alert tone="danger">{error}</Alert>;

  // Expert edit turns the whole panel into the premium tier: contrast tile with gold details.
  // Every themed element fades on the same curve, so the switch reads as one movement.
  const muted = isExpert ? "text-contrast-muted-foreground" : "text-muted-foreground";
  const divider = isExpert ? "border-contrast-border" : "border-border";
  const accent = isExpert ? "text-premium-bright" : "text-primary";
  const payVariant = isExpert ? "premium" : "download";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        noValidate
        className={cn(
          cn("flex flex-col gap-4 rounded-xl border p-4 sm:p-5", FADE),
          isExpert ? "border-contrast-border bg-contrast text-contrast-foreground" : "border-border bg-surface-raised",
        )}
      >
        <div>
          <p className={cn("text-sm font-semibold", FADE, accent)}>
            <CrossFade
              show={isExpert}
              on={
                <span className="flex items-center gap-1.5">
                  <CrownIcon aria-hidden="true" className="size-4" />
                  Expert edit selected
                </span>
              }
              off="Ready to download"
            />
          </p>
          <h2 id="panel-heading" className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            <CrossFade show={isExpert} on="Perfected by a specialist" off="Choose your photo" />
          </h2>
        </div>

        <fieldset>
          <legend className="sr-only">Choose your option</legend>
          <div className="flex flex-col gap-3">
            {(["standard", "expert_edit"] as const).map((key) => {
              const p = plans[key];
              const active = plan === key;
              const premium = key === "expert_edit";
              return (
                <label
                  key={key}
                  className={cn(
                    cn("block cursor-pointer rounded-lg border p-3.5 sm:p-4", FADE),
                    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                    // A 2px ring, not just a color change, marks the selection (WCAG 1.4.1).
                    premium
                      ? active
                        ? "border-premium-bright bg-contrast-raised ring-1 ring-premium-bright"
                        : "border-premium/40 bg-premium-subtle hover:border-premium"
                      : active
                        ? "border-primary bg-background ring-1 ring-primary"
                        : "border-contrast-border bg-contrast-raised hover:border-contrast-muted-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={key}
                    checked={active}
                    onChange={() => setPlan(key)}
                    className="sr-only"
                  />
                  <span className="flex items-start justify-between gap-4">
                    <span className="flex min-w-0 items-start gap-3">
                      <span
                        className={cn(
                          cn("mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border", FADE),
                          active
                            ? premium
                              ? "border-premium-bright bg-premium-bright text-premium-foreground"
                              : "border-primary bg-primary text-primary-foreground"
                            : premium
                              ? "border-premium"
                              : "border-contrast-muted-foreground",
                        )}
                      >
                        <CheckIcon
                          className={cn(
                            "size-3 transition-[opacity,scale] duration-300 ease-standard motion-reduce:transition-none",
                            active ? "scale-100 opacity-100" : "scale-50 opacity-0",
                          )}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{p.title}</span>
                          {premium && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                                FADE,
                                active ? "bg-premium-bright text-premium-foreground" : "bg-premium text-background",
                              )}
                            >
                              <CrownIcon aria-hidden="true" className="size-3" />
                              Premium
                            </span>
                          )}
                        </span>
                        {/* Cards on the contrast tile (selected Expert, unselected Standard) use its muted tone. */}
                        <span className={cn("mt-0.5 block text-sm", FADE, active === premium ? "text-contrast-muted-foreground" : "text-muted-foreground")}>
                          {PLAN_TAGLINES[key]}
                        </span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-display text-2xl font-semibold tracking-tight",
                        FADE,
                        premium && (active ? "text-premium-bright" : "text-premium"),
                      )}
                    >
                      {p.amountFormatted}
                    </span>
                  </span>
                  {/* Fixed-height line on the Expert card: an upsell, then a confirmation once chosen. */}
                  {premium && (
                    <span className="mt-2 block pl-8 text-sm font-semibold">
                      <CrossFade
                        show={active}
                        off={
                          <span className="flex items-center gap-1.5 text-premium">
                            Upgrade to hand retouching
                            <ArrowRightIcon className="size-4 shrink-0" />
                          </span>
                        }
                        on={
                          <span className="flex items-center gap-1.5 text-premium-bright">
                            <CheckIcon className="size-4 shrink-0" />
                            Retouched by hand, included
                          </span>
                        }
                      />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Desktop: inline email and pay button. Mobile uses the sticky bar and the email sheet. */}
        <div className="hidden flex-col gap-3 lg:flex">
          <Field id="checkout-email" label="Email for delivery">
            {(props) => (
              <Input
                {...props}
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                className="h-12"
              />
            )}
          </Field>
          <Button
            type="submit"
            size="lg"
            variant={payVariant}
            className={cn("h-12 w-full aria-disabled:opacity-50", BUTTON_MOTION)}
            // Not `disabled`: that would drop keyboard focus to <body> mid-payment.
            aria-disabled={pending || undefined}
          >
            {pending ? (
              <>
                {spinner}
                Processing…
              </>
            ) : (
              <CrossFade
                show={isExpert}
                className="justify-items-center"
                on={
                  <span className="flex items-center gap-2">
                    <CrownIcon aria-hidden="true" className="size-4" />
                    Get expert edit · {plans.expert_edit.amountFormatted}
                  </span>
                }
                off={
                  <span className="flex items-center gap-2">
                    <LockIcon aria-hidden="true" className="size-4" />
                    Buy and download · {plans.standard.amountFormatted}
                  </span>
                }
              />
            )}
          </Button>
          {errorMessage}
        </div>

        {/* Collapsed by default: each plan's tagline and the assurances below sum it up, so the pay button stays close. */}
        <details
          className={cn(
            "group rounded-lg border",
            FADE,
            isExpert ? "border-contrast-border bg-contrast-raised" : "border-border bg-surface",
          )}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <CrossFade show={isExpert} on="What's included with Expert edit" off="What's included with Standard" />
            <ArrowRightIcon
              aria-hidden="true"
              className="size-4 shrink-0 transition-transform duration-300 ease-standard group-open:rotate-90 motion-reduce:transition-none"
            />
          </summary>
          <div className="grid px-4 pb-4">
            {(["standard", "expert_edit"] as const).map((key) => {
              const shown = plan === key;
              return (
                <ul
                  key={key}
                  aria-hidden={!shown || undefined}
                  className={cn("col-start-1 row-start-1 flex flex-col gap-2", FADE, shown ? "opacity-100" : "opacity-0")}
                >
                  {plans[key].features.map((f, i) => {
                    const Icon: IconComponent = key === "expert_edit" ? (EXPERT_ICONS[i] ?? CheckIcon) : CheckIcon;
                    return (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Icon
                          aria-hidden="true"
                          className={cn("mt-0.5 size-4 shrink-0", key === "expert_edit" ? "text-premium-bright" : "text-primary")}
                        />
                        {f}
                      </li>
                    );
                  })}
                </ul>
              );
            })}
          </div>
        </details>

        <div className={cn("grid border-t pt-4 text-xs", FADE, divider)}>
          {([false, true] as const).map((expertList) => (
            <ul
              key={String(expertList)}
              aria-hidden={expertList !== isExpert || undefined}
              className={cn(
                "col-start-1 row-start-1 grid grid-cols-3 gap-3",
                FADE,
                expertList === isExpert ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {(expertList ? EXPERT_ASSURANCES : STANDARD_ASSURANCES).map(({ Icon, title, detail }) => (
                <li key={title} className="flex flex-col items-center gap-1 text-center">
                  <Icon aria-hidden="true" className={cn("size-5 shrink-0", FADE, accent)} />
                  <span className="font-semibold">{title}</span>
                  <span className={cn(FADE, muted)}>{detail}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <p className={cn("-mt-1 flex items-center justify-center gap-1.5 text-xs", FADE, muted)}>
          <LockIcon aria-hidden="true" className="size-3.5" />
          One-time payment, secured by Razorpay
        </p>
      </form>

      {/* Mobile: frosted sticky pay bar */}
      <div
        className={cn(
          cn("fixed inset-x-0 bottom-0 z-40 border-t px-gutter pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden", FADE),
          isExpert ? "border-contrast-border bg-contrast/90 text-contrast-foreground" : "border-border bg-background/85",
        )}
      >
        {error && !pending && <div className="mb-2">{errorMessage}</div>}
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">
              <CrossFade
                show={isExpert}
                on={
                  <span className="flex items-center gap-1 text-premium-bright">
                    <CrownIcon aria-hidden="true" className="size-3" />
                    Expert edit · one-time
                  </span>
                }
                off={<span className="text-muted-foreground">Standard · one-time</span>}
              />
            </p>
            <p className="font-display text-xl leading-tight font-semibold tracking-tight">
              <CrossFade show={isExpert} on={plans.expert_edit.amountFormatted} off={plans.standard.amountFormatted} />
            </p>
          </div>
          <Button
            size="lg"
            variant={payVariant}
            onClick={openEmailDialog}
            aria-disabled={pending || undefined}
            className={cn("h-12 flex-1 aria-disabled:opacity-50", BUTTON_MOTION)}
          >
            {pending ? (
              <>
                {spinner}
                Processing…
              </>
            ) : (
              <CrossFade
                show={isExpert}
                className="justify-items-center"
                on={
                  <span className="flex items-center gap-2">
                    <CrownIcon aria-hidden="true" className="size-4" />
                    Get expert edit
                  </span>
                }
                off={
                  <span className="flex items-center gap-2">
                    <LockIcon aria-hidden="true" className="size-4" />
                    Buy and download
                  </span>
                }
              />
            )}
          </Button>
        </div>
      </div>

      {/* Email sheet: bottom sheet on mobile, centred dialog on desktop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click is a pointer convenience; Escape and the Close button cover keyboards */}
      <dialog
        ref={dialogRef}
        aria-labelledby="email-dialog-title"
        onClick={(e) => {
          // Click on the backdrop closes it
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-0 mt-auto w-full max-w-none rounded-t-xl border border-border bg-surface-raised text-foreground backdrop:bg-overlay sm:m-auto sm:max-w-md sm:rounded-xl"
      >
        <form onSubmit={handleDialogSubmit} noValidate className="flex flex-col gap-5 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="email-dialog-title" className="font-display text-xl font-semibold tracking-tight">
                Where should we send your photo?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isExpert
                  ? "Your expert-edited photo and invoice will be emailed here."
                  : "You'll download it right away, and we'll email a copy with your invoice."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="-mt-1 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-transform active:scale-95"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-4 py-3",
              isExpert ? "bg-contrast text-contrast-foreground" : "bg-surface",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {isExpert ? <CrownIcon aria-hidden="true" className="size-4 text-premium-bright" /> : <CheckIcon className="size-4 text-primary" />}
              {selected.title}
            </span>
            <span className={cn("font-display text-lg font-semibold tracking-tight", isExpert && "text-premium-bright")}>
              {selected.amountFormatted}
            </span>
          </div>

          <Field id="checkout-dialog-email" label="Email address" errors={error ? [error] : undefined}>
            {(props) => (
              <Input
                {...props}
                ref={dialogEmailRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                enterKeyHint="go"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="you@example.com"
                maxLength={254}
                className="h-12"
              />
            )}
          </Field>

          <Button
            type="submit"
            size="lg"
            variant={payVariant}
            aria-disabled={pending || undefined}
            className={cn("h-12 w-full aria-disabled:opacity-50", BUTTON_MOTION)}
          >
            {payIcon}
            {`Continue to payment · ${selected.amountFormatted}`}
          </Button>
          <p className="-mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <LockIcon aria-hidden="true" className="size-3.5" />
            Secured by Razorpay · Refund if rejected
          </p>
        </form>
      </dialog>
    </>
  );
}

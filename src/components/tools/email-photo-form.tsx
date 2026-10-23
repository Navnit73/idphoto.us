"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";
import { apiPost, ClientApiError } from "@/lib/http/client";
import { fieldErrors, photoEmailSchema } from "@/lib/validation/forms";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

/** Sends the result links to an address the visitor enters. The address isn't stored. */
export function EmailPhotoForm({ resultId }: { resultId: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const parsed = photoEmailSchema.safeParse({ ...values, resultId });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setStatus({ kind: "sending" });
    try {
      await apiPost("/photo/email", parsed.data);
      setStatus({ kind: "sent" });
    } catch (error) {
      if (error instanceof ClientApiError) {
        setErrors(error.fields);
        setStatus({ kind: "error", message: error.message });
      } else {
        setStatus({ kind: "error", message: "Something went wrong. Please try again." });
      }
    }
  }

  if (status.kind === "sent") {
    return (
      <Alert tone="success">
        <p className="font-semibold">Email sent</p>
        <p className="mt-1">Check your inbox for the links. If it isn&apos;t there in a few minutes, look in your spam folder.</p>
      </Alert>
    );
  }

  return (
    <section aria-labelledby="email-photo-heading" className="flex flex-col gap-3 rounded-xl border bg-surface-raised p-5">
      <h2 id="email-photo-heading" className="font-display text-xl font-semibold tracking-tight">
        Email me this photo
      </h2>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Field id="email-photo-address" label="Email address" hint="Used only to send this message." errors={errors.email}>
            {(props) => <Input {...props} name="email" type="email" autoComplete="email" required maxLength={200} />}
          </Field>
        </div>

        {/* Honeypot: invisible to people and assistive tech; bots tend to fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="email-photo-website">Website</label>
          <input id="email-photo-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Button type="submit" className="sm:mt-7" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Send"}
        </Button>
      </form>
      {status.kind === "error" && <Alert tone="danger">{status.message}</Alert>}
    </section>
  );
}

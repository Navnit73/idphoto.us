"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui/field";
import { apiPost, ClientApiError } from "@/lib/http/client";
import { CONTACT_TOPICS, contactSchema, fieldErrors } from "@/lib/validation/forms";

const TOPIC_LABELS: Record<(typeof CONTACT_TOPICS)[number], string> = {
  general: "General question",
  correction: "Report an error in a guide",
  "tool-problem": "Problem with a tool",
  privacy: "Privacy request",
  other: "Something else",
};

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;

    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setStatus({ kind: "sending" });
    try {
      await apiPost("/contact", parsed.data);
      form.reset();
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
        <p className="font-semibold">Message sent</p>
        <p className="mt-1">Thanks for getting in touch. We read every message and usually reply within a few business days.</p>
      </Alert>
    );
  }

  return (
    <section aria-labelledby="contact-form-heading" className="rounded-xl border bg-surface-raised p-5 shadow-sm sm:p-8">
      <h2 id="contact-form-heading" className="font-display text-2xl font-semibold tracking-tight">
        Send us a message
      </h2>
      <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="contact-name" label="Name" errors={errors.name}>
            {(props) => <Input {...props} name="name" autoComplete="name" required maxLength={100} />}
          </Field>
          <Field id="contact-email" label="Email" errors={errors.email}>
            {(props) => <Input {...props} name="email" type="email" autoComplete="email" required maxLength={200} />}
          </Field>
        </div>
        <Field id="contact-topic" label="Topic" errors={errors.topic}>
          {(props) => (
            <Select {...props} name="topic" defaultValue="general">
              {CONTACT_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {TOPIC_LABELS[topic]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          id="contact-message"
          label="Message"
          hint="Please don't attach or paste photos of yourself or ID documents."
          errors={errors.message}
        >
          {(props) => <Textarea {...props} name="message" required minLength={20} maxLength={5000} rows={6} />}
        </Field>

        {/* Honeypot: invisible to people and assistive tech; bots tend to fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {status.kind === "error" && <Alert tone="danger">{status.message}</Alert>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We use your details only to reply. See the{" "}
            <a href="/privacy-policy" className="text-primary underline underline-offset-4">
              privacy policy
            </a>
            .
          </p>
          <Button type="submit" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
    </section>
  );
}

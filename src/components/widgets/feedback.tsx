"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Textarea } from "@/components/ui/field";

type State =
  | { step: "ask" }
  | { step: "comment"; helpful: boolean }
  | { step: "sending" }
  | { step: "done" }
  | { step: "error"; message: string; helpful: boolean };

/** "Was this page helpful?" — stores an anonymous vote (and optional comment) to improve content. */
export function Feedback({ path }: { path: string }) {
  const [state, setState] = useState<State>({ step: "ask" });
  const [comment, setComment] = useState("");

  async function submit(helpful: boolean) {
    setState({ step: "sending" });
    try {
      // This widget sits on most content pages; load the HTTP client only when someone actually votes.
      const { apiPost } = await import("@/lib/http/client");
      await apiPost("/feedback", { path, helpful, comment: comment.trim() || undefined });
      setState({ step: "done" });
    } catch (error) {
      // apiPost throws ClientApiError, whose messages are written for people; anything else (e.g. a failed chunk load) isn't.
      const message = error instanceof Error && error.name === "ClientApiError" ? error.message : "Couldn't send feedback.";
      setState({ step: "error", helpful, message });
    }
  }

  return (
    <section aria-labelledby="feedback-heading" className="rounded-lg border bg-surface p-5 sm:p-6">
      <h2 id="feedback-heading" className="text-lg font-semibold">
        Was this page helpful?
      </h2>

      {state.step === "ask" && (
        <div className="mt-4 flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setState({ step: "comment", helpful: true })}>
            Yes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setState({ step: "comment", helpful: false })}>
            No
          </Button>
        </div>
      )}

      {state.step === "comment" && (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(state.helpful);
          }}
        >
          <label htmlFor="feedback-comment" className="text-sm text-muted-foreground">
            {state.helpful ? "Great! Anything we could add?" : "Sorry about that. What was missing or wrong?"} (optional — please
            don&apos;t include personal details)
          </label>
          <Textarea id="feedback-comment" value={comment} maxLength={1000} onChange={(event) => setComment(event.target.value)} />
          <div>
            <Button type="submit" size="sm">
              Send feedback
            </Button>
          </div>
        </form>
      )}

      {state.step === "sending" && <p className="mt-4 text-sm text-muted-foreground">Sending…</p>}
      {state.step === "done" && (
        <Alert tone="success" className="mt-4">
          Thanks — your feedback helps us keep this page accurate.
        </Alert>
      )}
      {state.step === "error" && (
        <div className="mt-4 flex flex-col items-start gap-3">
          <Alert tone="danger">{state.message}</Alert>
          <Button variant="outline" size="sm" onClick={() => setState({ step: "comment", helpful: state.helpful })}>
            Try again
          </Button>
        </div>
      )}
    </section>
  );
}

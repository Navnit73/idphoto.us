import "server-only";

import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

import { serverEnv } from "@/lib/env/server";
import { logger } from "@/lib/logger";

import type { MailContent } from "./templates";

export class MailNotConfiguredError extends Error {
  constructor() {
    super("SMTP_HOST is not set");
    this.name = "MailNotConfiguredError";
  }
}

/** Thrown when the SMTP server rejects or drops a message. Carries no addresses. */
export class MailDeliveryError extends Error {
  constructor(readonly code?: string) {
    super("Email delivery failed");
    this.name = "MailDeliveryError";
  }
}

export function isMailConfigured() {
  return Boolean(serverEnv.SMTP_HOST);
}

// One transport per server process; parked on globalThis so dev reloads don't pile them up.
const globalForMail = globalThis as typeof globalThis & { __mailer?: Transporter };

function transport(): Transporter {
  if (!serverEnv.SMTP_HOST) throw new MailNotConfiguredError();
  globalForMail.__mailer ??= nodemailer.createTransport({
    host: serverEnv.SMTP_HOST,
    port: serverEnv.SMTP_PORT,
    secure: serverEnv.SMTP_SECURE,
    requireTLS: !serverEnv.SMTP_SECURE,
    auth: serverEnv.SMTP_USER ? { user: serverEnv.SMTP_USER, pass: serverEnv.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return globalForMail.__mailer;
}

type Envelope = { to: string; replyTo?: string };

export type MailAttachment = Pick<NonNullable<SendMailOptions["attachments"]>[number], "filename" | "content" | "contentType">;

/**
 * The site's single way to send email. Build the content with a template from
 * `./templates` so every message has a plain-text part and escaped HTML.
 * `kind` is only for logs; addresses and content are never logged.
 * Resolves to the SMTP message id.
 */
export async function sendMail(kind: string, envelope: Envelope, content: MailContent, attachments?: MailAttachment[]) {
  const mailer = transport();
  try {
    const info = await mailer.sendMail({
      from: serverEnv.MAIL_FROM ?? serverEnv.SMTP_USER,
      to: envelope.to,
      replyTo: envelope.replyTo,
      subject: content.subject,
      text: content.text,
      html: content.html,
      attachments,
    });
    logger.info("mail sent", { kind, messageId: info.messageId });
    return info.messageId as string;
  } catch (error) {
    const code = (error as { code?: string }).code;
    logger.error("mail failed", { kind, code, responseCode: (error as { responseCode?: number }).responseCode });
    throw new MailDeliveryError(code);
  }
}

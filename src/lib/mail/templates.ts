import "server-only";

import { siteConfig } from "@/config/site";

export type MailContent = { subject: string; text: string; html: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Deliberately plain markup: no colors or webfonts, so messages read well in
 * every client and in both light and dark mail themes.
 */
function layout(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body style="font-family:system-ui,sans-serif;line-height:1.5;max-width:560px;margin:0 auto;padding:24px">${body}<p style="margin-top:32px;font-size:13px">— ${escapeHtml(siteConfig.name)} · <a href="${siteConfig.url}">${escapeHtml(siteConfig.url.replace(/^https?:\/\//, ""))}</a></p></body></html>`;
}

const formatDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });

export function photoReadyEmail(input: { countryName: string; pageUrl: string; downloadUrl: string; expiresAt: Date }): MailContent {
  const expires = `${formatDate.format(input.expiresAt)} UTC`;
  const subject = `Your ${input.countryName} passport photo`;
  return {
    subject,
    text: [
      `Your ${input.countryName} passport photo is ready.`,
      "",
      `View it: ${input.pageUrl}`,
      `Download it: ${input.downloadUrl}`,
      "",
      `These links stop working after ${expires}, so save the file before then.`,
      "Before you submit, compare the photo against your country's official requirements. The issuing agency makes the final decision.",
      "",
      `You're receiving this because someone asked ${siteConfig.name} to email this photo to this address. If that wasn't you, you can ignore this message.`,
    ].join("\n"),
    html: layout(
      subject,
      `<p>Your ${escapeHtml(input.countryName)} passport photo is ready.</p>
<p><a href="${escapeHtml(input.pageUrl)}">View your photo</a> · <a href="${escapeHtml(input.downloadUrl)}">Download it</a></p>
<p>These links stop working after ${escapeHtml(expires)}, so save the file before then.</p>
<p>Before you submit, compare the photo against your country's official requirements. The issuing agency makes the final decision.</p>
<p style="font-size:13px">You're receiving this because someone asked ${escapeHtml(siteConfig.name)} to email this photo to this address. If that wasn't you, you can ignore this message.</p>`,
    ),
  };
}

export function contactNotificationEmail(input: {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  pagePath: string | null;
}): MailContent {
  const subject = `[${siteConfig.name}] New ${input.topic} message from ${input.name}`;
  const meta = [`From: ${input.name} <${input.email}>`, `Topic: ${input.topic}`, `Page: ${input.pagePath ?? "—"}`, `ID: ${input.id}`];
  return {
    subject,
    text: [...meta, "", input.message, "", "Reply to this email to answer the sender."].join("\n"),
    html: layout(
      subject,
      `<p>${meta.map(escapeHtml).join("<br>")}</p>
<p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
<p style="font-size:13px">Reply to this email to answer the sender.</p>`,
    ),
  };
}

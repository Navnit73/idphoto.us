import "server-only";

import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/payments/currency";
import { documentTheme as t } from "@/styles/document-theme";

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

/**
 * Payment confirmation. The finished photo and invoice PDF go along as attachments
 * (see fulfillment-service), plus download and invoice links.
 * Inline styles and literal colors: mail clients don't load stylesheets or CSS variables.
 */
export function paymentSuccessEmail(input: {
  countryName: string;
  dimensions: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  razorpayPaymentId: string;
  downloadUrl: string;
  invoiceUrl: string;
  isExpertEdit?: boolean;
}): MailContent {
  const subject = `Your ${input.countryName} passport photo is ready`;
  const country = escapeHtml(input.countryName);
  const paid = formatMoney(input.amount, input.currency);
  const { linkExpiryMinutes } = siteConfig.privacy;
  const expertNote = "Expert edit: a photo specialist is now reviewing and retouching your photo by hand. We'll email you the final version.";

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0;color:${t.muted}">${label}</td>
      <td style="padding:6px 0;text-align:right;color:${t.foreground};font-weight:600">${value}</td>
    </tr>`;

  return {
    subject,
    text: [
      `Hi,`,
      ``,
      `Thanks for your payment of ${paid}. Your ${input.countryName} passport photo (${input.dimensions} px) is attached to this email, along with your invoice ${input.invoiceNumber}.`,
      `You can also download it here (link valid for ${linkExpiryMinutes} minutes): ${input.downloadUrl}`,
      `View your invoice: ${input.invoiceUrl}`,
      ...(input.isExpertEdit ? [``, expertNote] : []),
      ``,
      `Print tip: print on 4×6 in photo paper at any pharmacy or photo lab, then cut along the edges.`,
      ``,
      `Payment reference: ${input.razorpayPaymentId}`,
      `Questions? Reply to this email or write to ${siteConfig.supportEmail}.`,
      ``,
      `— ${siteConfig.name}`,
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:${t.foreground}">
        <h1 style="font-size:20px;margin:0 0 12px">Payment received — your photo is ready</h1>
        <p style="font-size:15px;line-height:24px;color:${t.body};margin:0 0 20px">
          Your <strong>${country}</strong> passport photo (${escapeHtml(input.dimensions)} px) is attached to this email, along with your invoice.
        </p>
        ${input.isExpertEdit ? `<p style="font-size:14px;line-height:22px;color:${t.foreground};background:${t.surface};border:1px solid ${t.borderStrong};border-radius:8px;padding:12px 16px;margin:0 0 20px">${expertNote}</p>` : ""}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid ${t.border};border-radius:8px;padding:12px 16px;margin:0 0 20px">
          ${row("Amount paid", escapeHtml(paid))}
          ${row("Invoice", escapeHtml(input.invoiceNumber))}
          ${row("Payment ref", `<span style="font-family:monospace;font-size:12px">${escapeHtml(input.razorpayPaymentId)}</span>`)}
        </table>
        <a href="${escapeHtml(input.downloadUrl)}" style="display:inline-block;background:${t.primary};color:${t.primaryForeground};text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px">
          Download photo
        </a>
        <p style="font-size:12px;line-height:18px;color:${t.faint};margin:8px 0 0">Link valid for ${linkExpiryMinutes} minutes. The attachment doesn't expire.</p>
        <p style="font-size:13px;line-height:20px;margin:16px 0 0">
          <a href="${escapeHtml(input.invoiceUrl)}" style="color:${t.primary}">View invoice ${escapeHtml(input.invoiceNumber)}</a>
        </p>
        <p style="font-size:13px;line-height:20px;color:${t.muted};margin:24px 0 0">
          Print tip: print on 4×6 in photo paper at any pharmacy or photo lab, then cut along the edges.
        </p>
        <hr style="border:none;border-top:1px solid ${t.border};margin:24px 0" />
        <p style="font-size:12px;line-height:18px;color:${t.faint};margin:0">
          Questions? Reply to this email or write to ${escapeHtml(siteConfig.supportEmail)}.<br />${escapeHtml(siteConfig.name)}
        </p>
      </div>`,
  };
}

/** Tells the team a paid expert-edit order is waiting for manual review. */
export function expertEditNotificationEmail(input: {
  customerEmail: string;
  paymentId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  countryName: string;
  dimensions: string;
  photoUrl: string;
}): MailContent {
  const paid = formatMoney(input.amount, input.currency);
  const rows: [string, string][] = [
    ["Customer", input.customerEmail],
    ["Country", input.countryName],
    ["Dimensions", `${input.dimensions} px`],
    ["Amount", paid],
    ["Payment ID", input.paymentId],
    ["Razorpay ID", input.razorpayPaymentId],
  ];

  return {
    subject: `[Expert edit] ${input.countryName} photo for ${input.customerEmail}`,
    text: [
      `New expert edit order. Retouch the photo and email the final version to the customer.`,
      ``,
      ...rows.map(([k, v]) => `${k}: ${v}`),
      `Photo: ${input.photoUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:${t.foreground}">
        <h1 style="font-size:18px;margin:0 0 8px">New expert edit order</h1>
        <p style="font-size:14px;line-height:22px;color:${t.body};margin:0 0 16px">
          Retouch the photo and email the final version to the customer (reply to this email).
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 16px">
          ${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:${t.muted}">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`).join("")}
        </table>
        <a href="${escapeHtml(input.photoUrl)}" style="color:${t.primary}">Open full-resolution photo</a>
      </div>`,
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

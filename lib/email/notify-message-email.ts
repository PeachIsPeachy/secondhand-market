import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";

type Payload = {
  recipientUserId: string;
  senderDisplayName: string;
  productTitle: string;
  previewSnippet: string;
  threadPath: string;
};

/** Sends transactional mail via Resend when RESEND_API_KEY is set. */
export async function sendNewMessageEmailNotice(payload: Payload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM?.trim() || "ReListed <onboarding@resend.dev>";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    process.env.URL?.replace(/\/$/, "") ||
    "";

  if (!apiKey || !siteUrl) {
    return;
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return;
  }

  const { data, error } = await admin.auth.admin.getUserById(payload.recipientUserId);
  if (error || !data?.user?.email) {
    return;
  }

  const recipientEmail = data.user.email;
  const chatLink = `${siteUrl}${payload.threadPath}`;
  const subject = `${payload.senderDisplayName} messaged you about “${payload.productTitle.slice(0, 80)}${payload.productTitle.length > 80 ? "…" : ""}”`;
  const safeSnippet =
    payload.previewSnippet.slice(0, 280) + (payload.previewSnippet.length > 280 ? "…" : "");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0c0c0e;max-width:560px">
      <p style="margin:0 0 12px;font-size:15px">Hi,</p>
      <p style="margin:0 0 12px;font-size:15px"><strong>${escapeHtml(payload.senderDisplayName)}</strong> sent you a message about <strong>${escapeHtml(payload.productTitle)}</strong>:</p>
      <blockquote style="margin:0 0 16px;padding:12px 14px;border-left:4px solid #0b63c9;background:#f1f2f5;font-size:14px">${escapeHtml(safeSnippet)}</blockquote>
      <p style="margin:0 0 8px;font-size:15px"><a href="${escapeHtml(chatLink)}" style="color:#0b63c9;font-weight:600">Open conversation on ReListed</a></p>
      <p style="margin:16px 0 0;font-size:12px;color:#5c6370">You received this because messaging alerts are enabled for your account.</p>
    </div>
  `.trim();

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipientEmail,
      subject,
      html,
    }),
  }).catch(() => {});
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

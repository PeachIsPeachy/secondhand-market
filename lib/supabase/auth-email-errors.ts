import type { AuthError } from "@supabase/supabase-js";

/** Turns cryptic Auth errors into actionable hints for email signup / resend flows. */
export function describeAuthEmailIssue(error: AuthError): string {
  const msg = error.message ?? "Something went wrong";
  const lower = msg.toLowerCase();
  const logs =
    " Check Supabase → Authentication → Logs (or Project Logs) at the time you clicked send for the exact failure.";

  if (
    lower.includes("not authorized") ||
    lower.includes("email address not authorized") ||
    lower.includes("address not authorized")
  ) {
    return `${msg} Without custom SMTP, Supabase only sends auth mail to addresses that belong to your Supabase organization (Dashboard → Organization → Team). For everyone else, set up Authentication → SMTP (e.g. Resend or SendGrid).${logs}`;
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("too many") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("email rate limit")
  ) {
    return `${msg} Wait and try again later, or raise limits under Authentication → Rate Limits / your SMTP provider.${logs}`;
  }

  if (lower.includes("smtp") || lower.includes("sending email")) {
    return `${msg} Review Authentication → SMTP credentials and sender address.${logs}`;
  }

  return `${msg}${logs}`;
}

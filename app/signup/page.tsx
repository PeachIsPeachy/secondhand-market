"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { describeAuthEmailIssue } from "@/lib/supabase/auth-email-errors";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setResendError(null);
    setResendNotice(null);
    const trimmed = email.trim();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const supabase = createClient();

    setLoading(true);
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: redirectTo,
        },
      });

      if (signErr) {
        const lower = signErr.message.toLowerCase();
        if (
          lower.includes("already registered") ||
          lower.includes("already been registered") ||
          lower.includes("user already registered")
        ) {
          const { error: resendErr } = await supabase.auth.resend({
            type: "signup",
            email: trimmed,
            options: { emailRedirectTo: redirectTo },
          });
          if (!resendErr) {
            setNotice(
              "If this email still needs confirmation, we sent another confirmation message—check your inbox (and spam)."
            );
            router.refresh();
            return;
          }
          setError(describeAuthEmailIssue(resendErr));
          return;
        }
        setError(describeAuthEmailIssue(signErr));
        return;
      }

      const user = data.user;
      const session = data.session;

      /**
       * With "Confirm email" on, Supabase often hides duplicate signups: same email + still unconfirmed
       * returns a user-shaped payload with no identities and no session. That flow usually does not mail again,
       * so we explicitly resend the signup confirmation.
       */
      const duplicateUnconfirmedObfuscated =
        !!user &&
        !session &&
        (user.identities?.length ?? 0) === 0 &&
        !user.email_confirmed_at;

      if (duplicateUnconfirmedObfuscated) {
        const { error: resendErr } = await supabase.auth.resend({
          type: "signup",
          email: trimmed,
          options: { emailRedirectTo: redirectTo },
        });
        if (resendErr) {
          setError(describeAuthEmailIssue(resendErr));
          return;
        }
        setNotice(
          "That email already has a pending account. We sent another confirmation message—check your inbox (and spam)."
        );
        router.refresh();
        return;
      }

      setNotice("Check your email to confirm your account before signing in.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onResendConfirmation() {
    const trimmed = email.trim();
    if (!trimmed) {
      setResendError("Enter your email above first.");
      return;
    }
    setResendError(null);
    setResendNotice(null);
    setResendLoading(true);
    const supabase = createClient();
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setResendLoading(false);
    if (resendErr) {
      setResendError(describeAuthEmailIssue(resendErr));
      return;
    }
    setResendNotice(
      "If Supabase accepted this request, check inbox and spam. If nothing arrives, your project likely needs Authentication → SMTP — built‑in mail often skips addresses outside your Supabase organization."
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">
        Create account
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Join ReListed to list items and message buyers securely.
      </p>
      <p className="mx-auto mt-4 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        <span className="font-semibold">Emails missing?</span> Set{" "}
        <strong>Authentication → SMTP</strong> in the Supabase dashboard. Without it, confirmation mail usually{" "}
        only reaches addresses invited under{" "}
        <strong>Organization → Team</strong>. Official guide:{" "}
        <a
          className="font-medium text-primary underline underline-offset-2"
          href="https://supabase.com/docs/guides/auth/auth-smtp"
          target="_blank"
          rel="noopener noreferrer"
        >
          Custom SMTP
        </a>
        .
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mx-auto mt-8 max-w-sm space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {notice}{" "}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
              Go to login
            </Link>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-muted">Name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <p className="mt-1 text-xs text-muted">At least 6 characters.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>
        <div className="rounded-xl border border-border bg-surface/60 px-3 py-3">
          <p className="text-xs text-muted">
            No email yet? Check spam, or send another confirmation to the address above.
          </p>
          <button
            type="button"
            disabled={resendLoading}
            onClick={() => void onResendConfirmation()}
            className="mt-2 w-full rounded-lg border border-border bg-surface py-2 text-xs font-semibold text-foreground transition hover:bg-border/30 disabled:opacity-60"
          >
            {resendLoading ? "Sending…" : "Resend confirmation email"}
          </button>
          {resendError && (
            <p className="mt-2 text-xs text-red-700">{resendError}</p>
          )}
          {resendNotice && (
            <p className="mt-2 text-xs text-emerald-800">{resendNotice}</p>
          )}
        </div>
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

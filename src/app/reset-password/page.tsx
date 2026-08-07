"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, KeyRound, CheckCircle2, Gamepad2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [noSession, setNoSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setNoSession(true);
    });
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setReady(true);
        setNoSession(false);
      }
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message);
      else setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-instock">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-serif text-xl font-bold text-text-primary">Password updated</h1>
          <p className="mt-2 text-sm text-text-muted">You can now log in with your new password.</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-accent-oxblood px-6 py-3 font-semibold text-white hover:bg-accent-oxblood/90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-chrome">
          <Gamepad2 className="h-6 w-6 text-bg" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Set a new password</h1>
        <p className="mt-1 text-sm text-text-muted">
          {noSession ? "Invalid or expired reset link." : "Enter a new password for your account."}
        </p>
      </div>

      {noSession ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-sm text-text-muted">
            This link is invalid or has expired. Request a new one.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-accent-oxblood px-6 py-3 font-semibold text-white hover:bg-accent-oxblood/90"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-surface p-6"
        >
          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">New password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-chrome focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-chrome focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !ready}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-oxblood py-3 font-bold text-white shadow-lg shadow-accent-oxblood/25 transition hover:bg-accent-oxblood/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
            Update Password
          </button>
        </form>
      )}
    </div>
  );
}

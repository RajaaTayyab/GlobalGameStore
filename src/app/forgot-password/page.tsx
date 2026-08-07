"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, Gamepad2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-chrome">
          <Gamepad2 className="h-6 w-6 text-bg" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Reset your password</h1>
        <p className="mt-1 text-sm text-text-muted">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-instock" />
          <h2 className="mt-4 font-serif text-lg font-bold text-text-primary">Check your email</h2>
          <p className="mt-2 text-sm text-text-muted">
            If an account exists for <span className="text-text-primary">{email}</span>, we&apos;ve
            sent a password reset link.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-accent-oxblood px-6 py-3 font-semibold text-white hover:bg-accent-oxblood/90"
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
            <label className="mb-1.5 block text-sm text-text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-chrome focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-oxblood py-3 font-bold text-white shadow-lg shadow-accent-oxblood/25 transition hover:bg-accent-oxblood/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
            Send Reset Link
          </button>
          <p className="text-center text-sm text-text-muted">
            <Link href="/login" className="font-medium text-accent-chrome hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

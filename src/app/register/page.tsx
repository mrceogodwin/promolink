"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

type Role = "audience_owner" | "advertiser";

function RegisterForm() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [role, setRole] = useState<Role>(
    roleParam === "advertiser" ? "advertiser" : "audience_owner"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (roleParam === "advertiser" || roleParam === "audience_owner") {
      setRole(roleParam);
    }
  }, [roleParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    // Authentication backend is not configured yet.
    // Do not claim success or that details were recorded.
    await new Promise((r) => setTimeout(r, 400));

    setStatus("error");
    setMessage(
      "Account registration is not available yet. The authentication system is still being configured. Please check back soon or contact us if you need early access."
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-near-black tracking-tight">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          Choose how you want to use PromoLink.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("audience_owner")}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              role === "audience_owner"
                ? "border-primary bg-primary-light/50 ring-1 ring-primary"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-sm font-semibold text-near-black">Audience Owner</p>
            <p className="text-xs text-muted mt-0.5">List WhatsApp audiences & earn</p>
          </button>
          <button
            type="button"
            onClick={() => setRole("advertiser")}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              role === "advertiser"
                ? "border-primary bg-primary-light/50 ring-1 ring-primary"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-sm font-semibold text-near-black">Advertiser</p>
            <p className="text-xs text-muted mt-0.5">Reach WhatsApp audiences</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-near-black mb-1.5">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-near-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-near-black mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-near-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-near-black mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-near-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="At least 8 characters"
            />
          </div>

          {message && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-deep transition-colors disabled:opacity-60"
          >
            {status === "loading"
              ? "Checking…"
              : role === "audience_owner"
              ? "Register as Audience Owner"
              : "Register as Advertiser"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-deep">
            Log in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/" className="hover:text-primary">← Back to homepage</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  );
}

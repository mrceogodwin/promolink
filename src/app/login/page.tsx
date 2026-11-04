"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to log in.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to log in. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-[#f4faf5] flex flex-col">
      <header className="bg-white border-b border-[#e0ebe3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-[#e0ebe3] shadow-[0_16px_50px_rgba(8,74,44,.07)] p-8">
            <h1 className="text-2xl font-bold text-[#11251b] tracking-tight">Log in</h1>
            <p className="mt-2 text-sm text-[#61746a]">
              Access your PromoLink account.
            </p>

            <Link href="/api/auth/google" className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg border border-[#d6e5da] bg-white px-4 py-3 text-sm font-bold text-[#11251b] transition-colors hover:bg-[#f7faf7]">
              <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.03 13.22l7.98 6.19C12.18 13.72 17.62 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.9c-.58 2.96-2.25 5.48-4.73 7.18l7.63 5.91c4.45-4.12 7.18-10.19 7.18-17.56Z"/><path fill="#FBBC05" d="M10.01 28.59A14.4 14.4 0 0 1 9.25 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.58 10.78l7.43-6.19Z"/><path fill="#34A853" d="M24 48c6.47 0 11.91-2.13 15.88-5.89l-7.63-5.91c-2.12 1.42-4.83 2.26-8.25 2.26-6.38 0-11.82-4.22-13.99-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
              Continue with Google
            </Link>
            <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-[#e0ebe3]"/><span className="text-xs text-[#8a9a90]">OR CONTINUE WITH EMAIL</span><div className="h-px flex-1 bg-[#e0ebe3]"/></div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#11251b] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#d6e5da] px-3.5 py-2.5 text-sm text-[#11251b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08794e]/20 focus:border-[#08794e]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#11251b] mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={10}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#d6e5da] px-3.5 py-2.5 text-sm text-[#11251b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08794e]/20 focus:border-[#08794e]"
                  placeholder="••••••••"
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
                className="w-full rounded-lg bg-[#08794e] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-green-900/10 transition-colors hover:bg-[#05613e] disabled:opacity-60"
              >
                {status === "loading" ? "Logging in…" : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#61746a]">
              Don’t have an account?{" "}
              <Link href="/register" className="font-medium text-[#08794e] hover:text-[#05613e]">
                Create one
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-[#61746a]">
            <Link href="/" className="hover:text-[#08794e]">← Back to homepage</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCallbackUrl = () => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const url = params.get("callbackUrl");
    if (!url) return null;
    // Guard against open-redirect via a protocol-relative "//" URL.
    return url.startsWith("/") && !url.startsWith("//") ? url : null;
  };

  const expired =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("expired") === "true";

  // Determine safe redirect
  const handleGoToDashboard = () => {
    const callbackUrl = getCallbackUrl();
    if (session?.user?.role === "SUPER_ADMIN") {
      router.push("/admin/dashboard");
    } else if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setIsLoading(false);
        setError("Invalid email or password.");
        return;
      }

      // Determine redirect destination
      const callbackUrl = getCallbackUrl();
      let destination = callbackUrl || "/dashboard";

      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sess = await sessionRes.json();
          if (sess?.user?.role === "SUPER_ADMIN") {
            destination = "/admin/dashboard";
          }
        }
      } catch {
        // Fallback to default destination
      }

      // Hard redirect to ensure HTTP-only cookies are processed cleanly and router state is refreshed
      window.location.href = destination;
    } catch (err) {
      console.error("[Login] Error during sign in:", err);
      setIsLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="relative isolate min-h-[85vh] bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div
        className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-20"
        aria-hidden="true"
      >
        <div
          className="relative left-[50%] top-[20%] aspect-1155/678 w-[40rem] -translate-x-1/2 bg-gradient-to-tr from-neon-purple to-neon-lavender"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="max-w-md w-full space-y-8 bg-dark-card border border-dark-border p-8 rounded-2xl shadow-neon relative">
        <Link href="/" className="inline-block mb-3">
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-neon-purple to-neon-lavender bg-clip-text text-transparent neon-text-glow">
            UNCOOKED
          </span>
        </Link>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Welcome back. Enter your credentials to continue.
          </p>
        </div>

        {status === "authenticated" && session?.user && (
          <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Signed in as</span>
              <span className="text-xs font-bold text-neon-lavender truncate max-w-[180px]">
                {session.user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={handleGoToDashboard}
              className="w-full btn-primary text-xs py-2 font-bold flex items-center justify-center gap-1.5"
            >
              <span>Continue to {session.user.role === "SUPER_ADMIN" ? "Admin Console" : "Dashboard"}</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}

        {expired && (
          <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
            Your session expired. Please sign in again.
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-dark-border px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple"
              placeholder="you@campus.edu"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-300"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-neon-purple hover:text-neon-lavender font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-dark-border px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.959 8.959 0 013.682-.788c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-4.692-4.692a3 3 0 00-4.243-4.243m4.242 4.242L3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary text-[13px] py-2.5 font-bold disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-neon-purple hover:text-neon-lavender font-semibold"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

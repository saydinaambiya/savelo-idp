"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const sessionStateID = searchParams.get("session_state_id") || "";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!token || !sessionStateID) {
      setError("Invalid or missing Magic Link parameters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionStateID,
          magicLinkToken: token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-5 border border-blue-100 dark:border-blue-900 shadow-sm">
        <ShieldCheck className="w-7 h-7" strokeWidth={2.25} />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-50">
        Confirm Your Login
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
        To prevent automated email crawlers from prematurely consuming your one-time link, please click below to confirm login.
      </p>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl text-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-start gap-2.5 text-left">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center justify-center gap-2 text-base font-semibold mb-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.25} />
            <span>Login Confirmed</span>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            Your identity has been verified. The application session on your initiating device has been unlocked automatically.
            You may now safely close this window.
          </p>
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={loading || !token || !sessionStateID}
          className="w-full py-3 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
              <span>Verifying Session...</span>
            </>
          ) : (
            <>
              <span>Confirm Login</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            <span>Loading verification...</span>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </main>
  );
}

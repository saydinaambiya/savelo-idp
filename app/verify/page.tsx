"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, ArrowRight, Loader2, AlertCircle, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121316] p-8 shadow-2xl text-center transition-colors duration-200">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white dark:bg-white dark:text-black mb-4 shadow-xs">
        <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2 text-black dark:text-white">
        Confirm Your Login
      </h1>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
        To prevent automated security scanners from consuming your single-use credential, please confirm this verification request.
      </p>

      {error && (
        <div className="mb-5 p-3 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 text-red-600 dark:text-red-400 flex items-start gap-2.5 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-5 rounded-xl border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-black/50 text-black dark:text-white space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            <span>Identity Verified Successfully</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Your login has been confirmed. The application session on your initiating device has been unlocked automatically.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-500">
            You may now safely close this window.
          </div>
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={loading || !token || !sessionStateID}
          className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying Session...</span>
            </>
          ) : (
            <>
              <span>Authorize Login</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 bg-zinc-50 dark:bg-[#080809] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="w-full max-w-7xl flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
            Savelo IdP
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="my-auto py-10 w-full flex items-center justify-center">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading verification handshake...</span>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </div>

      <div className="text-center text-[11px] font-mono text-zinc-500">
        Cryptographic Proof Handshake • Zero-Password Protection
      </div>
    </main>
  );
}

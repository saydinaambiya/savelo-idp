"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  ExternalLink,
  ArrowRight,
  Loader2,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function AuthorizeForm() {
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id") || "savelo-tools";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "S256";
  const state = searchParams.get("state") || "";
  const scope = searchParams.get("scope") || "openid profile email";
  const nonce = searchParams.get("nonce") || "";

  const [identifier, setIdentifier] = useState("");
  const [sessionStateID, setSessionStateID] = useState("");
  const [magicLinkUrl, setMagicLinkUrl] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"initiate" | "verify">("initiate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const waitingSse = step === "verify" && Boolean(sessionStateID);

  // SSE cross-device listener
  useEffect(() => {
    if (!sessionStateID || step !== "verify") return;

    const eventSource = new EventSource(
      `/api/auth/status?session_state_id=${encodeURIComponent(sessionStateID)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "verified" && data.authCode) {
          eventSource.close();
          const targetUrl = new URL(data.redirectUri || redirectUri);
          targetUrl.searchParams.set("code", data.authCode);
          if (data.state) targetUrl.searchParams.set("state", data.state);
          window.location.href = targetUrl.toString();
        } else if (data.status === "rejected" || data.status === "expired") {
          setError(`Session ${data.status}. Please try again.`);
          eventSource.close();
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };

    eventSource.onerror = () => {
      // EventSource reconnects automatically
    };

    return () => {
      eventSource.close();
    };
  }, [sessionStateID, step, redirectUri]);

  async function handleInitiate(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          client_id: clientId,
          redirect_uri: redirectUri || undefined,
          code_challenge: codeChallenge || undefined,
          code_challenge_method: codeChallengeMethod || undefined,
          state: state || undefined,
          scope: scope || undefined,
          nonce: nonce || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to initiate login");
      }

      setSessionStateID(data.sessionStateID);
      if (data.magicLinkUrl) {
        setMagicLinkUrl(data.magicLinkUrl);
      }
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }

      setStep("verify");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || !sessionStateID) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionStateID,
          otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      if (data.redirectUri && data.authCode) {
        const targetUrl = new URL(data.redirectUri);
        targetUrl.searchParams.set("code", data.authCode);
        if (data.state) targetUrl.searchParams.set("state", data.state);
        window.location.href = targetUrl.toString();
      } else {
        throw new Error("Missing authCode in response");
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121316] p-8 shadow-2xl transition-colors duration-200">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white dark:bg-white dark:text-black mb-3 shadow-xs">
          <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
          Savelo Identity Provider
        </h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">
          Zero-Password Authentication for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{clientId}</span>
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === "initiate" ? (
        <form onSubmit={handleInitiate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email or Phone Number
            </label>
            <input
              type="text"
              placeholder="user@savelo.com or +62812345678"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !identifier.trim()}
            className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching Credentials...</span>
              </>
            ) : (
              <>
                <span>Continue with Zero-Password</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-black/40 p-3.5 rounded-xl border border-zinc-200 dark:border-white/10 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <div>
              A 6-digit OTP and Magic Link were dispatched for{" "}
              <span className="font-semibold text-black dark:text-white">{identifier}</span>.
            </div>
          </div>

          {devOtp && (
            <div className="p-3 bg-zinc-100 dark:bg-black/60 border border-zinc-300 dark:border-white/10 rounded-xl text-xs font-mono flex items-center justify-between">
              <span className="text-zinc-500 uppercase tracking-wider">Dev Sandbox OTP</span>
              <span className="font-bold text-sm tracking-widest bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-black dark:text-white">
                {devOtp}
              </span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center tracking-widest text-2xl font-mono px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Confirm OTP</span>
                </>
              )}
            </button>
          </form>

          {waitingSse && (
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-3 border-t border-zinc-200 dark:border-white/10 font-mono">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Waiting for confirmation from another device...</span>
            </div>
          )}

          {magicLinkUrl && (
            <div className="pt-2 text-center">
              <a
                href={magicLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white underline font-medium"
              >
                <span>Open Magic Link Simulation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuthorizePage() {
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
              <span>Initializing Savelo Identity Security Node...</span>
            </div>
          }
        >
          <AuthorizeForm />
        </Suspense>
      </div>

      <div className="text-center text-[11px] font-mono text-zinc-500">
        RFC 6749 • RFC 7636 PKCE S256 Protected
      </div>
    </main>
  );
}

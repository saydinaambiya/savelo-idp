"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  KeyRound,
  ExternalLink,
  ArrowRight,
  Loader2,
  AlertCircle,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

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
      setMagicLinkUrl(data.magicLinkUrl || "");
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("verify");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;

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
        throw new Error(data.message || data.error || "Failed to verify OTP");
      }

      if (data.authCode && (data.redirectUri || redirectUri)) {
        const targetUrl = new URL(data.redirectUri || redirectUri);
        targetUrl.searchParams.set("code", data.authCode);
        if (data.state) targetUrl.searchParams.set("state", data.state);
        window.location.href = targetUrl.toString();
      } else {
        setError("Login verified! Redirecting...");
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg mb-3 shadow-md">
          <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Savelo Identity Provider
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Zero-Password Login for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{clientId}</span>
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl text-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {step === "initiate" ? (
        <form onSubmit={handleInitiate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
              Email or Phone Number
            </label>
            <input
              type="text"
              placeholder="user@savelo.com or +62812345678"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !identifier.trim()}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                <span>Sending credentials...</span>
              </>
            ) : (
              <>
                <span>Continue with Zero-Password</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900 flex items-start gap-2.5">
            <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              A 6-digit OTP and Magic Link were dispatched for{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{identifier}</span>.
            </div>
          </div>

          {devOtp && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-mono flex items-center justify-between">
              <span className="font-semibold text-amber-900 dark:text-amber-200">Dev Sandbox OTP</span>
              <span className="font-bold text-sm tracking-wider bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                {devOtp}
              </span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center tracking-widest text-2xl font-mono px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                  <span>Confirm OTP</span>
                </>
              )}
            </button>
          </form>

          {waitingSse && (
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.25} />
              <span>Waiting for confirmation from another device or Magic Link...</span>
            </div>
          )}

          {magicLinkUrl && (
            <div className="pt-2 text-center">
              <a
                href={magicLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
              >
                <span>Open Magic Link simulation</span>
                <ExternalLink className="w-3 h-3" strokeWidth={2} />
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
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            <span>Loading Savelo IdP...</span>
          </div>
        }
      >
        <AuthorizeForm />
      </Suspense>
    </main>
  );
}

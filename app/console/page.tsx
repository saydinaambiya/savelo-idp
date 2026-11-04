"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  KeyRound,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  AlertTriangle,
  X,
  Loader2,
  Play,
  RotateCw,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";

export default function DeveloperConsolePage() {
  const [activeTab, setActiveTab] = useState<"register" | "playground">("playground");

  // Registration Form States
  const [appName, setAppName] = useState("");
  const [redirectUris, setRedirectUris] = useState<string[]>(["http://localhost:3000/api/auth/callback"]);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{
    clientId: string;
    plainSecret: string;
    appName: string;
    redirectUri: string;
  } | null>(null);

  // Playground States
  const [clientMode, setClientMode] = useState<"demo" | "custom">("demo");
  const [customClientId, setCustomClientId] = useState("");
  const [customClientSecret, setCustomClientSecret] = useState("");
  const [customRedirectUri, setCustomRedirectUri] = useState("http://localhost:3000/api/auth/callback");

  // PKCE State
  const [codeVerifier, setCodeVerifier] = useState("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk_sample");
  const [codeChallenge, setCodeChallenge] = useState("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  const [stateParam, setStateParam] = useState("sandbox-state-xyz");

  // Token Exchange State
  const [authCodeInput, setAuthCodeInput] = useState("");
  const [tokenExchanging, setTokenExchanging] = useState(false);
  const [tokenResult, setTokenResult] = useState<Record<string, unknown> | null>(null);
  const [tokenError, setTokenError] = useState("");

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeClientId = clientMode === "demo" ? "savelo-tools" : customClientId.trim();
  const activeSecret = clientMode === "demo" ? "savelo_sec_demo_secret" : customClientSecret.trim();
  const activeRedirectUri = clientMode === "demo" ? "http://localhost:3000/api/auth/callback" : customRedirectUri.trim();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegeneratePkce = async () => {
    // Generate 43 random characters
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = Array.from(array)
      .map((b) => ("0" + b.toString(16)).slice(-2))
      .join("")
      .slice(0, 43);

    // Compute S256 Challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const base64Challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    setCodeVerifier(verifier);
    setCodeChallenge(base64Challenge);
    setStateParam("state-" + Math.random().toString(36).substring(2, 9));
  };

  const handleAddUri = () => {
    setRedirectUris([...redirectUris, ""]);
  };

  const handleRemoveUri = (index: number) => {
    if (redirectUris.length <= 1) return;
    setRedirectUris(redirectUris.filter((_, i) => i !== index));
  };

  const handleUriChange = (index: number, value: string) => {
    const updated = [...redirectUris];
    updated[index] = value;
    setRedirectUris(updated);
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegistering(true);

    const filteredUris = redirectUris.map((u) => u.trim()).filter(Boolean);
    if (!appName.trim() || filteredUris.length === 0) {
      setRegisterError("App name and at least one redirect URI are required.");
      setRegistering(false);
      return;
    }

    try {
      const res = await fetch("/api/developer/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName.trim(),
          redirectUris: filteredUris,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || "Failed to create application.");
      }

      setCreatedCredentials({
        clientId: data.client.clientId,
        plainSecret: data.plainSecret,
        appName: data.client.name,
        redirectUri: filteredUris[0],
      });
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : "Error registering app");
    } finally {
      setRegistering(false);
    }
  };

  const handleExchangeToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCodeInput.trim()) return;

    setTokenExchanging(true);
    setTokenError("");
    setTokenResult(null);

    try {
      const res = await fetch("/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: activeClientId,
          client_secret: activeSecret,
          code: authCodeInput.trim(),
          redirect_uri: activeRedirectUri,
          code_verifier: codeVerifier,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || data.error || "Token exchange failed");
      }

      setTokenResult(data);
    } catch (err: unknown) {
      setTokenError(err instanceof Error ? err.message : "Exchange failed");
    } finally {
      setTokenExchanging(false);
    }
  };

  const authUrl = `/oauth/authorize?client_id=${encodeURIComponent(
    activeClientId || "savelo-tools"
  )}&redirect_uri=${encodeURIComponent(
    activeRedirectUri || "http://localhost:3000/api/auth/callback"
  )}&response_type=code&state=${encodeURIComponent(
    stateParam
  )}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#080809] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Banner */}
        <div className="pb-8 border-b border-zinc-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                <span className="text-stroke font-black">DEVELOPER</span>{" "}
                <span className="text-black dark:text-white">CONSOLE</span>
              </h1>
              <p className="mt-1 text-xs font-mono text-zinc-500">
                Self-service client provisioning & real-time OAuth 2.0 PKCE testing sandbox.
              </p>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("playground")}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === "playground"
                    ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                Sandbox & Playground
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === "register"
                    ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                Register App
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: AUTH SANDBOX & PLAYGROUND */}
        {activeTab === "playground" && (
          <div className="my-8 space-y-8">
            {/* Step 1: Configure Client Credentials */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-500" />
                    <span>1. Target Client Credentials</span>
                  </h2>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">
                    Choose the pre-seeded sandbox client or test your own registered credentials.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setClientMode("demo")}
                    className={`px-3 py-1.5 rounded-md border transition ${
                      clientMode === "demo"
                        ? "bg-black text-white dark:bg-white dark:text-black border-transparent font-semibold"
                        : "border-zinc-300 dark:border-white/10 text-zinc-500 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Demo Client (savelo-tools)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientMode("custom")}
                    className={`px-3 py-1.5 rounded-md border transition ${
                      clientMode === "custom"
                        ? "bg-black text-white dark:bg-white dark:text-black border-transparent font-semibold"
                        : "border-zinc-300 dark:border-white/10 text-zinc-500 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Custom Client
                  </button>
                </div>
              </div>

              {clientMode === "custom" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">Client ID</label>
                    <input
                      type="text"
                      placeholder="e.g. saveroute-web-1234"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">Client Secret</label>
                    <input
                      type="password"
                      placeholder="savelo_sec_..."
                      value={customClientSecret}
                      onChange={(e) => setCustomClientSecret(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">Redirect URI</label>
                    <input
                      type="text"
                      placeholder="http://localhost:3000/api/auth/callback"
                      value={customRedirectUri}
                      onChange={(e) => setCustomRedirectUri(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10">
                    <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">Client ID</span>
                    <span className="font-semibold text-black dark:text-white">savelo-tools</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10">
                    <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">Client Secret</span>
                    <span className="font-semibold text-zinc-500">••••••••••••••••</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10">
                    <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">Redirect URI</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate block">
                      http://localhost:3000/api/auth/callback
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: PKCE Generator & Authorize URL */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <span>2. PKCE Parameters & Authorization Trigger</span>
                  </h2>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">
                    Real-time S256 code challenge generation and simulated browser redirection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRegeneratePkce}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-white/10 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Regenerate PKCE</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                    code_verifier (Keep in Client Session)
                  </span>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-black/60 border border-zinc-200 dark:border-white/10 flex items-center justify-between">
                    <code className="text-zinc-800 dark:text-zinc-200 truncate">{codeVerifier}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeVerifier, "code-verifier")}
                      className="p-1 text-zinc-400 hover:text-black dark:hover:text-white ml-2"
                    >
                      {copiedKey === "code-verifier" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                    code_challenge (SHA-256 Base64URL)
                  </span>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-black/60 border border-zinc-200 dark:border-white/10 flex items-center justify-between">
                    <code className="text-zinc-800 dark:text-zinc-200 truncate">{codeChallenge}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeChallenge, "code-challenge")}
                      className="p-1 text-zinc-400 hover:text-black dark:hover:text-white ml-2"
                    >
                      {copiedKey === "code-challenge" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated Auth URL Box */}
              <div className="space-y-1.5 font-mono text-xs">
                <span className="text-[10px] text-zinc-500 uppercase block">Computed Authorization Endpoint URL</span>
                <div className="p-3 rounded-lg bg-white dark:bg-black border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 break-all leading-relaxed">
                  {authUrl}
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={authUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Login Simulation in New Window</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Step 3: Token Exchange Tester */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] space-y-5">
              <div className="pb-4 border-b border-zinc-200 dark:border-white/10">
                <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-500" />
                  <span>3. Authorization Code to Token Exchange Tester</span>
                </h2>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  Paste the authorization code received from the callback query string to test POST /api/oauth/token.
                </p>
              </div>

              {tokenError && (
                <div className="p-3 rounded-lg text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-mono">
                  {tokenError}
                </div>
              )}

              <form onSubmit={handleExchangeToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Authorization Code (?code=...)
                  </label>
                  <input
                    type="text"
                    placeholder="Paste the authorization code returned to callback URI..."
                    value={authCodeInput}
                    onChange={(e) => setAuthCodeInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={tokenExchanging || !authCodeInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {tokenExchanging ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Exchanging Code...</span>
                    </>
                  ) : (
                    <span>Exchange for Tokens</span>
                  )}
                </button>
              </form>

              {/* Token Response Payload Viewer */}
              {tokenResult && (
                <div className="mt-4 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                    <span>Token Response (200 OK)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(tokenResult, null, 2), "token-result")}
                      className="hover:text-black dark:hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === "token-result" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-white/10 overflow-x-auto text-zinc-800 dark:text-zinc-200 text-[11px] leading-relaxed">
                    {JSON.stringify(tokenResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER APPLICATION FORM */}
        {activeTab === "register" && (
          <div className="my-8 max-w-2xl mx-auto">
            <div className="p-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] space-y-6">
              <div>
                <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-zinc-500" />
                  <span>Register Client Application</span>
                </h2>
                <p className="text-xs font-mono text-zinc-500 mt-1">
                  Provision an OAuth 2.0 / OIDC identity client with PKCE security enforcement.
                </p>
              </div>

              {registerError && (
                <div className="p-3 rounded-lg text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-mono">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegisterClient} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Application Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saveroute API or Savetable Web"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Callback / Redirect URIs
                    </label>
                    <button
                      type="button"
                      onClick={handleAddUri}
                      className="text-xs text-zinc-500 hover:text-black dark:hover:text-white transition flex items-center gap-1 font-mono"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add URI</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {redirectUris.map((uri, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="https://example.com/api/auth/callback"
                          value={uri}
                          onChange={(e) => handleUriChange(idx, e.target.value)}
                          required
                          className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white transition"
                        />
                        {redirectUris.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUri(idx)}
                            className="p-2 text-zinc-400 hover:text-red-500 transition shrink-0"
                            title="Remove URI"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                    Must use HTTPS in production. HTTP is permitted only on localhost.
                  </span>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={registering}
                    className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning Credentials...</span>
                      </>
                    ) : (
                      <span>Register Client Application</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Show-Once Secret Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#121316] p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                <Check className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white">Credentials Provisioned</h3>
            </div>

            <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block font-sans">Store these credentials securely.</span>
                Savelo IdP stores only cryptographic hashes. The Client Secret will never be displayed again.
              </div>
            </div>

            {/* Client ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Client ID
              </label>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-white/10 font-mono text-xs">
                <span className="truncate text-zinc-900 dark:text-zinc-100">{createdCredentials.clientId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(createdCredentials.clientId, "modal-client-id")}
                  className="p-1 text-zinc-500 hover:text-black dark:hover:text-white ml-2"
                >
                  {copiedKey === "modal-client-id" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Client Secret */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Client Secret (Copy Now)
              </label>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-white/10 font-mono text-xs">
                <span className="truncate text-zinc-900 dark:text-zinc-100">{createdCredentials.plainSecret}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(createdCredentials.plainSecret, "modal-client-secret")}
                  className="p-1 text-zinc-500 hover:text-black dark:hover:text-white ml-2"
                >
                  {copiedKey === "modal-client-secret" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Copy .env snippet */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const envSnippet = `# Savelo IdP Integration\nSAVELO_IDP_ISSUER="http://localhost:3000"\nSAVELO_CLIENT_ID="${createdCredentials.clientId}"\nSAVELO_CLIENT_SECRET="${createdCredentials.plainSecret}"\nSAVELO_REDIRECT_URI="${createdCredentials.redirectUri}"\n`;
                  handleCopy(envSnippet, "modal-env-snippet");
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-300 dark:border-white/15 text-xs font-mono text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>
                  {copiedKey === "modal-env-snippet" ? "Copied .env Snippet to Clipboard!" : "Copy .env Configuration"}
                </span>
              </button>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setClientMode("custom");
                  setCustomClientId(createdCredentials.clientId);
                  setCustomClientSecret(createdCredentials.plainSecret);
                  setCustomRedirectUri(createdCredentials.redirectUri);
                  setCreatedCredentials(null);
                  setActiveTab("playground");
                }}
                className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider border border-zinc-300 dark:border-white/15 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition"
              >
                Test in Playground
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

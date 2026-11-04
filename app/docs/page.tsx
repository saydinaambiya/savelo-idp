"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  BookOpen,
  KeyRound,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Layers,
} from "lucide-react";

export default function DocumentationPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<"curl" | "typescript" | "python">("typescript");

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlAuthorizeExample = `curl -X GET "http://localhost:3000/oauth/authorize?\\
client_id=savelo-tools&\\
redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fcallback&\\
response_type=code&\\
state=xyz123&\\
code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&\\
code_challenge_method=S256"`;

  const curlTokenExchangeExample = `curl -X POST "http://localhost:3000/api/oauth/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=savelo-tools" \\
  -d "client_secret=savelo_sec_your_secret_here" \\
  -d "code=auth_code_received_from_callback" \\
  -d "redirect_uri=http://localhost:3001/api/auth/callback" \\
  -d "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"`;

  const tsExchangeSnippet = `// Next.js App Router: app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const verifier = req.cookies.get("pkce_verifier")?.value;

  if (!code || !verifier) {
    return NextResponse.json({ error: "Missing authorization code or verifier" }, { status: 400 });
  }

  const tokenRes = await fetch("http://localhost:3000/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.SAVELO_CLIENT_ID!,
      client_secret: process.env.SAVELO_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.SAVELO_REDIRECT_URI!,
      code_verifier: verifier,
    }),
  });

  const tokens = await tokenRes.json();
  // tokens: { access_token, id_token, refresh_token, token_type: "Bearer", expires_in: 900 }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}`;

  const pythonSnippet = `# FastAPI / Python client token exchange
import httpx

async def exchange_token(auth_code: str, pkce_verifier: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:3000/api/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": "savelo-tools",
                "client_secret": "savelo_sec_...",
                "code": auth_code,
                "redirect_uri": "http://localhost:3001/api/auth/callback",
                "code_verifier": pkce_verifier,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        return response.json()`;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#080809] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Banner */}
        <div className="pb-8 border-b border-zinc-200 dark:border-white/10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100 dark:bg-white/5 text-[11px] font-mono tracking-widest text-zinc-700 dark:text-zinc-300 uppercase mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="text-stroke font-black">INTEGRATION</span>{" "}
            <span className="text-black dark:text-white">GUIDELINES</span>
          </h1>
          <p className="mt-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Integration protocols and specifications for Savelo Identity Provider (IdP) authentication.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/console"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Console</span>
            </Link>
            <a
              href="/api/.well-known/openid-configuration"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition"
            >
              <span>/.well-known/openid-configuration</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 3-Column Layout: Navigation, Content, Code */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 my-10">
          {/* Left Sticky Index (Pure JetBrains Mono) */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="sticky top-24 p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] text-xs font-mono space-y-2.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-2 font-mono">
                Index
              </span>
              <a href="#overview" className="block text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition font-mono">
                Overview
              </a>
              <a href="#client-registration" className="block text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition font-mono">
                Client Registration
              </a>
              <a href="#auth-flow" className="block text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition font-mono">
                PKCE Authorization Flow
              </a>
              <a href="#token-exchange" className="block text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition font-mono">
                Token Exchange
              </a>
              <a href="#endpoints" className="block text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition font-mono">
                Standard Endpoints
              </a>
            </div>
          </aside>

          {/* Right Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Section 1: Overview */}
            <section id="overview" className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-black dark:text-white">
                  Overview & Architecture
                </h2>
              </div>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Savelo IdP eliminates passwords entirely using a cryptographic dual-channel mechanism:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] space-y-1">
                  <div className="font-bold text-black dark:text-white font-mono text-xs">Zero-Password Authentication</div>
                  <p className="text-zinc-500 text-[11px] font-mono leading-relaxed">
                    Users login via 6-digit CSPRNG numeric OTP (salted with HMAC-SHA256) or Magic Links.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] space-y-1">
                  <div className="font-bold text-black dark:text-white font-mono text-xs">Cross-Device SSE Sync</div>
                  <p className="text-zinc-500 text-[11px] font-mono leading-relaxed">
                    Confirming a login on a secondary mobile device triggers instant push to the initiating desktop via Redis SSE.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] space-y-1">
                  <div className="font-bold text-black dark:text-white font-mono text-xs">OIDC & PKCE S256</div>
                  <p className="text-zinc-500 text-[11px] font-mono leading-relaxed">
                    Strict RFC 7636 PKCE code challenges mitigate authorization code interception attacks.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Client Registration */}
            <section id="client-registration" className="space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-black dark:text-white">
                  Client Registration
                </h2>
              </div>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Before your service can authenticate users, provision your application in the{" "}
                <Link href="/console" className="font-semibold underline text-black dark:text-white">
                  Developer Console
                </Link>
                :
              </p>
              <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed">
                <li>
                  Open the Developer Console and click <strong>&quot;Register Application&quot;</strong>.
                </li>
                <li>Enter your service name (e.g. <code>Saveroute API</code>) and whitelisted callback URLs.</li>
                <li>
                  Copy your <strong>Client ID</strong> and <strong>Client Secret</strong>. The secret is hashed with SHA-256 and will never be shown again.
                </li>
                <li>Store credentials in your service environment variables.</li>
              </ol>
            </section>

            {/* Section 3: PKCE Auth Flow */}
            <section id="auth-flow" className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-black dark:text-white">
                  PKCE Authorization Flow
                </h2>
              </div>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When a user initiates authentication, redirect them to the authorization endpoint:
              </p>

              {/* Code Box */}
              <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black overflow-hidden font-mono text-xs">
                <div className="px-4 py-2 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>GET /oauth/authorize</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(curlAuthorizeExample, "curl-auth")}
                    className="flex items-center gap-1 hover:text-black dark:hover:text-white font-mono"
                  >
                    {copiedKey === "curl-auth" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "curl-auth" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-zinc-800 dark:text-zinc-200 leading-relaxed font-mono">
                  {curlAuthorizeExample}
                </pre>
              </div>
            </section>

            {/* Section 4: Token Exchange */}
            <section id="token-exchange" className="space-y-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-black dark:text-white">
                  Token Exchange & Rotation
                </h2>
              </div>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Upon completing verification, Savelo IdP redirects back to your callback URL with an <code>authorization_code</code>. Exchange this code for tokens at <code>POST /api/oauth/token</code>:
              </p>

              {/* Code Snippet Tabs */}
              <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black overflow-hidden font-mono text-xs">
                <div className="px-4 py-2 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    {(["typescript", "curl", "python"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveSnippetTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider transition font-mono ${
                          activeSnippetTab === tab
                            ? "bg-black text-white dark:bg-white dark:text-black font-bold"
                            : "text-zinc-500 hover:text-black dark:hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const snippet =
                        activeSnippetTab === "typescript"
                          ? tsExchangeSnippet
                          : activeSnippetTab === "curl"
                          ? curlTokenExchangeExample
                          : pythonSnippet;
                      handleCopy(snippet, "tabbed-snippet");
                    }}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-black dark:hover:text-white font-mono"
                  >
                    {copiedKey === "tabbed-snippet" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "tabbed-snippet" ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <pre className="p-4 overflow-x-auto text-zinc-800 dark:text-zinc-200 leading-relaxed text-[11px] font-mono">
                  {activeSnippetTab === "typescript" && tsExchangeSnippet}
                  {activeSnippetTab === "curl" && curlTokenExchangeExample}
                  {activeSnippetTab === "python" && pythonSnippet}
                </pre>
              </div>
            </section>

            {/* Section 5: Endpoints Reference */}
            <section id="endpoints" className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-black dark:text-white">
                  Standard Endpoints
                </h2>
              </div>
              <div className="border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden font-mono text-xs">
                <div className="divide-y divide-zinc-200 dark:divide-white/10">
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50 dark:bg-[#121316]">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/15 text-[10px] font-bold font-mono">
                        GET
                      </span>
                      <code className="text-black dark:text-white font-mono">/api/.well-known/openid-configuration</code>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">Discovery document for OIDC clients</span>
                  </div>

                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/15 text-[10px] font-bold font-mono">
                        GET
                      </span>
                      <code className="text-black dark:text-white font-mono">/api/.well-known/jwks.json</code>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">Public RS256 RSA keys for JWT verification</span>
                  </div>

                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50 dark:bg-[#121316]">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/15 text-[10px] font-bold font-mono">
                        POST
                      </span>
                      <code className="text-black dark:text-white font-mono">/api/oauth/token</code>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">Authorization code & refresh token exchange</span>
                  </div>

                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/15 text-[10px] font-bold font-mono">
                        GET
                      </span>
                      <code className="text-black dark:text-white font-mono">/api/oauth/userinfo</code>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">User profile claims (requires Bearer token)</span>
                  </div>

                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50 dark:bg-[#121316]">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/15 text-[10px] font-bold font-mono">
                        POST
                      </span>
                      <code className="text-black dark:text-white font-mono">/api/oauth/revoke</code>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">Revoke active sessions and token families</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-6 md:p-12">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight">Savelo IdP</div>
            <div className="text-xs text-zinc-500">Centralized Identity Provider</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/api/.well-known/openid-configuration"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono transition"
          >
            <span>/.well-known/openid-configuration</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" strokeWidth={2} />
          </Link>
          <Link
            href="/api/.well-known/jwks.json"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono transition"
          >
            <span>/jwks.json</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" strokeWidth={2} />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 mb-6 border border-blue-200 dark:border-blue-900">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span>Zero-Password Management System</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mb-6">
          Enterprise Centralized Identity for Savelo Ecosystem
        </h1>

        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Secured with asymmetric RS256 JWT, PKCE Authorization Code flow, HMAC-SHA256 OTPs,
          cross-device SSE sync, and Redis-backed state machine.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/oauth/authorize?client_id=savelo-tools&redirect_uri=http://localhost:3000/callback&state=demo-state"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition active:scale-[0.99]"
          >
            <span>Test Zero-Password Login</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
          <a
            href="/docs/savelo_idp_architecture_design.md"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition"
          >
            <BookOpen className="w-4 h-4 text-zinc-500" strokeWidth={2} />
            <span>View Architecture Blueprint</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-16 w-full">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <KeyRound className="w-5 h-5" strokeWidth={2.25} />
              </div>
              <div className="text-zinc-900 dark:text-zinc-100 font-bold text-lg mb-2">
                01. Zero Passwords
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                No passwords stored or handled. Authenticate instantly via 6-digit CSPRNG OTP (HMAC-SHA256 with pepper) or 32-byte Magic Link.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <Smartphone className="w-5 h-5" strokeWidth={2.25} />
              </div>
              <div className="text-zinc-900 dark:text-zinc-100 font-bold text-lg mb-2">
                02. Cross-Device SSE
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Initiate on desktop, confirm on mobile. Real-time Redis Pub/Sub unlocks the desktop browser instantly upon confirmation.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <RefreshCw className="w-5 h-5" strokeWidth={2.25} />
              </div>
              <div className="text-zinc-900 dark:text-zinc-100 font-bold text-lg mb-2">
                03. Refresh Token Rotation
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Every token exchange rotates credentials. Token reuse triggers immediate Token Family Revocation across PostgreSQL and Redis.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full py-6 text-center text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
        Savelo Identity Provider · Next.js 16 App Router · TypeScript · PostgreSQL & Prisma · Redis
      </footer>
    </div>
  );
}

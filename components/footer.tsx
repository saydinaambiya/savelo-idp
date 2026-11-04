import Link from "next/link";
import { ShieldCheck, ExternalLink, Terminal, KeyRound } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#080809] text-zinc-600 dark:text-zinc-400 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <span className="font-bold tracking-tight text-black dark:text-white uppercase">
                Savelo IdP
              </span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
              Centralized zero-password authentication layer built for enterprise multi-app ecosystems.
            </p>
            <div className="font-mono text-[11px] text-zinc-500">
              RFC 6749 • RFC 7636 • OpenID Connect Core
            </div>
          </div>

          {/* Protocols */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-black dark:text-white text-xs uppercase tracking-wider">
              Protocols & Specs
            </h4>
            <ul className="space-y-1.5 font-mono text-[11px]">
              <li>
                <Link
                  href="/api/.well-known/openid-configuration"
                  target="_blank"
                  className="hover:text-black dark:hover:text-white transition flex items-center gap-1"
                >
                  <span>OpenID Discovery</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="/api/.well-known/jwks.json"
                  target="_blank"
                  className="hover:text-black dark:hover:text-white transition flex items-center gap-1"
                >
                  <span>Public JWKS Keys</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li className="text-zinc-500">PKCE S256 Challenge</li>
              <li className="text-zinc-500">Refresh Token Rotation</li>
            </ul>
          </div>

          {/* Developer Tools */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-black dark:text-white text-xs uppercase tracking-wider">
              Developer Portal
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/console" className="hover:text-black dark:hover:text-white transition flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Register Client App</span>
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-black dark:hover:text-white transition flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Integration Guide</span>
                </Link>
              </li>
              <li>
                <Link href="/docs#nextjs" className="hover:text-black dark:hover:text-white transition">
                  Next.js App Router Setup
                </Link>
              </li>
            </ul>
          </div>

          {/* Security Assurance */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-black dark:text-white text-xs uppercase tracking-wider">
              Security Standard
            </h4>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Zero-Emoji compliance, CSPRNG entropy generation, HMAC-SHA256 passwordless hashing, and constant-time latency guards.
            </p>
            <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              Environment: Production Ready
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; 2026 Savelo Identity Provider. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-black dark:hover:text-white transition">
              Documentation
            </Link>
            <Link href="/console" className="hover:text-black dark:hover:text-white transition">
              Console
            </Link>
            <span className="font-mono text-zinc-500">v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

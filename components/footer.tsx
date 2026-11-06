import Link from "next/link";
import { Shield, ExternalLink } from "lucide-react";
import packageJson from "@/package.json";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#080809] text-zinc-500 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                <Shield className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-black dark:text-white">
                Savelo IdP
              </span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
              Zero-password identity provider built on RFC 6749 OAuth 2.0 and OpenID Connect specifications.
            </p>
          </div>

          {/* Protocols */}
          <div className="space-y-2">
            <h4 className="font-medium text-black dark:text-white text-xs">
              Endpoints
            </h4>
            <ul className="space-y-1.5 text-xs">
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
            </ul>
          </div>

          {/* Developer Tools */}
          <div className="space-y-2">
            <h4 className="font-medium text-black dark:text-white text-xs">
              Platform
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/console" className="hover:text-black dark:hover:text-white transition">
                  Developer Console
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-black dark:hover:text-white transition">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            &copy; 2026 Savelo Identity Provider. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <Link href="/docs" className="hover:text-black dark:hover:text-white transition">
              Docs
            </Link>
            <Link href="/console" className="hover:text-black dark:hover:text-white transition">
              Console
            </Link>
            <span className="font-mono">v{packageJson.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

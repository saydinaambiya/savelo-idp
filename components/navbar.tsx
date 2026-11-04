"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/docs", label: "Documentation" },
    { href: "/console", label: "Developer Console" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#080809]/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold shadow-xs transition group-hover:scale-105">
            <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-black dark:text-white uppercase">
              Savelo
            </span>
            <span className="text-[10px] tracking-widest text-zinc-500 dark:text-zinc-400 font-mono -mt-1">
              IDENTITY.IDP
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide uppercase transition ${
                  isActive
                    ? "text-black dark:text-white bg-zinc-100 dark:bg-white/10"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Status Badge (Pure B&W, no neon) */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-200" />
            <span>IDP SECURE v0.1</span>
          </div>

          <ThemeToggle />

          <Link
            href="/oauth/authorize?client_id=savelo-tools&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback&response_type=code&state=demo-state&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition shadow-xs"
          >
            <span>Live Login Demo</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#080809] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-zinc-200 dark:border-white/10">
            <Link
              href="/oauth/authorize?client_id=savelo-tools&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback&response_type=code&state=demo-state&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black"
            >
              <span>Live Login Demo</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

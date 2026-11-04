"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X } from "lucide-react";
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

  const demoAuthUrl =
    "/oauth/authorize?client_id=savelo-tools&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback&response_type=code&state=demo-state&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#080809]/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-black dark:text-white">
            Savelo IdP
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs transition ${
                  isActive
                    ? "text-black dark:text-white font-medium"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="hidden sm:flex items-center gap-2.5">
          <ThemeToggle />

          <Link
            href="/console"
            className="px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition"
          >
            Console
          </Link>

          <Link
            href={demoAuthUrl}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
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
                className="px-2 py-1.5 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex gap-2">
            <Link
              href="/console"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 rounded-md text-xs font-medium border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-200"
            >
              Console
            </Link>
            <Link
              href={demoAuthUrl}
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 rounded-md text-xs font-medium bg-black text-white dark:bg-white dark:text-black"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

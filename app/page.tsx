import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  ArrowRight,
  ChevronRight,
  Smartphone,
  Cpu,
  RefreshCw,
  Clock,
  Terminal,
  Shield,
  FileCode2,
} from "lucide-react";

export default function HomePage() {
  const pillars = [
    {
      title: "Zero-Password Authentication",
      desc: "Eliminates credential stuffing and password reuse attacks. Authentication occurs exclusively via CSPRNG 6-digit OTP and signed Magic Links.",
      icon: KeyRound,
    },
    {
      title: "Cross-Device SSE Sync",
      desc: "Secondary mobile verification instantly resolves pending authentication on the initiating desktop via real-time Redis Server-Sent Events.",
      icon: Smartphone,
    },
    {
      title: "RS256 Asymmetric Signatures",
      desc: "Identity tokens and access tokens are signed using 2048-bit RSA private keys. Client microservices verify authenticity via the public JWKS endpoint.",
      icon: ShieldCheck,
    },
    {
      title: "Refresh Token Rotation (RTR)",
      desc: "Every token refresh invalidates the prior token. If reuse of an invalidated token is detected, the entire Token Family is revoked instantly.",
      icon: RefreshCw,
    },
    {
      title: "Anti-Enumeration WAF",
      desc: "Enforces time-constant response latency across user lookup endpoints, preventing malicious actors from enumerating valid account databases.",
      icon: Clock,
    },
    {
      title: "Developer Console Governance",
      desc: "Self-service client credential provisioning with one-time secret display, SHA-256 database hashing, and strict redirect URI whitelisting.",
      icon: Cpu,
    },
  ];

  const workflowSteps = [
    {
      title: "Authorization Request",
      desc: "Client app redirects user with RFC 7636 PKCE code_challenge (S256) and verified client_id.",
      icon: Shield,
    },
    {
      title: "Zero-Password Handshake",
      desc: "User inputs 6-digit OTP or confirms Magic Link across connected mobile or desktop devices.",
      icon: KeyRound,
    },
    {
      title: "PKCE Code Issuance",
      desc: "IdP issues a short-lived, single-use authorization code (TTL: 180s) stored ephemerally in Redis.",
      icon: Lock,
    },
    {
      title: "Token Exchange & RTR",
      desc: "Client backend exchanges code + verifier for RS256 Access Token, ID Token, and rotated Refresh Token.",
      icon: FileCode2,
    },
  ];

  const partnerServices = [
    "SAVELO CORE",
    "SAVETABLE",
    "SAVEROUTE",
    "SAVELO TOOLS",
    "SAVELO PAY",
    "SAVELO CLOUD",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#080809] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION: Clean, Authoritative, Spacious (No AI-slop tips or fake appliance boxes) */}
        <section className="relative overflow-hidden pt-24 pb-28 sm:pt-32 sm:pb-36 border-b border-zinc-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-8">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
                  <span className="text-stroke font-black block">SECURING IDENTITIES WITH</span>
                  <span className="text-black dark:text-white font-extrabold flex items-center gap-3">
                    <span>UNCOMPROMISING</span>
                    <span className="hidden sm:inline-block font-mono tracking-tighter text-zinc-400 dark:text-zinc-600 text-3xl sm:text-5xl font-light">
                      &gt;&gt;&gt;
                    </span>
                  </span>
                  <span className="text-black dark:text-white font-extrabold block">
                    SECURITY.
                  </span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                Centralized, zero-password identity authentication built on RFC 6749 and OpenID Connect specifications. Designed for enterprise microservices and secure multi-app ecosystems.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/console"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.99] transition shadow-sm"
                >
                  <span>Developer Console</span>
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </Link>

                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-white/30 hover:bg-zinc-100 dark:hover:bg-white/5 transition"
                >
                  <span>Documentation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* LOGO WALL: CONNECTED SERVICES */}
        <section className="py-12 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#0c0d0e]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-6 font-bold">
              Trusted Across Connected Services
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70">
              {partnerServices.map((name) => (
                <div
                  key={name}
                  className="font-mono text-xs sm:text-sm font-bold tracking-widest text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-white/10 transition"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6-PILLAR BENTO GRID */}
        <section className="py-20 sm:py-28 border-b border-zinc-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
            <div className="max-w-2xl">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 block mb-2 font-bold">
                Security Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                <span className="text-stroke font-black">ENGINEERED FOR</span>{" "}
                <span className="text-black dark:text-white">CRITICAL DEFENSE</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                A purpose-built authentication layer designed to safeguard internal APIs and user identities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="p-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] hover:border-zinc-400 dark:hover:border-white/30 transition shadow-xs space-y-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-black/60 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-black dark:text-white group-hover:scale-105 transition">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PROTOCOLS & LIFECYCLE (Identical Clean Card Style with Icons, No 1,2,3 Slop) */}
        <section className="py-20 sm:py-28 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#0c0d0e]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 block mb-2 font-bold">
                  Protocols & Lifecycle
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  <span className="text-black dark:text-white">HOW DOES</span>{" "}
                  <span className="text-stroke font-black">SAVELO IDP WORK?</span>
                </h2>
              </div>
              <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:underline shrink-0"
              >
                <span>Read Technical Specs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="p-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316] hover:border-zinc-400 dark:hover:border-white/30 transition shadow-xs space-y-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-black/60 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-black dark:text-white group-hover:scale-105 transition">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <h3 className="text-sm font-bold text-black dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="py-20 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              <span className="text-stroke font-black block">READY TO INTEGRATE</span>
              <span className="text-black dark:text-white block">ZERO-PASSWORD AUTH?</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Provision your client application in seconds or explore our step-by-step guides for Next.js, Node.js, and Python.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/console"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm"
              >
                <Cpu className="w-4 h-4" />
                <span>Go to Developer Console</span>
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition"
              >
                <Terminal className="w-4 h-4" />
                <span>Browse API Documentation</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

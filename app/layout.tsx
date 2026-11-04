import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Savelo Identity Provider | Zero-Password OAuth 2.0 & OIDC",
  description: "Centralized, enterprise-grade zero-password identity provider with PKCE, RS256 JWT, and refresh token rotation.",
};

const themeScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (savedTheme === 'dark' || prefersDark || !savedTheme) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[#ffffff] dark:bg-[#080809] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}

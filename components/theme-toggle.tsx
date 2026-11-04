"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => {
    window.removeEventListener("storage", callback);
    observer.disconnect();
  };
}

function getSnapshot(): "dark" | "light" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): "dark" | "light" {
  return "dark";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark/light theme"
      className="p-2 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-400 dark:hover:border-white/30 transition shadow-xs cursor-pointer"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" strokeWidth={2} />
      ) : (
        <Moon className="w-4 h-4" strokeWidth={2} />
      )}
    </button>
  );
}

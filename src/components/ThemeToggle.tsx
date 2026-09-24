"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import s from "./sidebar.module.css";

type Theme = "light" | "dark";

const EVENT = "themechange";
const APPLY_SAVED = `(function(){try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

// Rendered in <head> so the saved theme is applied before first paint. The
// client render gets type="text/plain" so React doesn't warn about <script>.
export function ThemeScript() {
  // Strict Mode's dev remount resets <html> attributes; re-apply the saved theme.
  useLayoutEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.dataset.theme = saved;
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: APPLY_SAVED }}
    />
  );
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <button className={s.themeToggle} onClick={toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      {theme === "dark" ? (
        <svg viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="10" r="3.5" fill="currentColor" />
          <path
            d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" aria-hidden>
          <path d="M16.5 12.2A6.8 6.8 0 0 1 7.8 3.5a6.8 6.8 0 1 0 8.7 8.7Z" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}

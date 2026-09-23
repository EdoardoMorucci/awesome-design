"use client";

import { useState, type ReactNode } from "react";
import s from "./detail.module.css";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for non-secure contexts (e.g. LAN IP during dev).
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export function useCopied(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  return [
    copied,
    (text) => {
      copyText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      });
    },
  ];
}

type Props = {
  text: string;
  children: ReactNode;
  variant?: "primary" | "default" | "ghost";
  title?: string;
};

export function CopyButton({ text, children, variant = "default", title }: Props) {
  const [copied, copy] = useCopied();
  const cls = variant === "primary" ? s.btnPrimary : variant === "ghost" ? s.btnGhost : s.btn;
  return (
    <button type="button" className={cls} onClick={() => copy(text)} title={title}>
      {copied ? "Copied ✓" : children}
    </button>
  );
}

export function Swatch({ name, value }: { name: string; value: string }) {
  const [copied, copy] = useCopied();
  return (
    <button type="button" className={s.swatch} onClick={() => copy(value)} title={`Copy ${value}`}>
      <span className={s.swatchColor} style={{ background: value }} />
      <span className={s.swatchMeta}>
        <strong>{name}</strong>
        <code>{copied ? "Copied ✓" : value}</code>
      </span>
    </button>
  );
}

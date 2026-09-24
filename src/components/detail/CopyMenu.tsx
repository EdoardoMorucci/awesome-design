"use client";

import { useEffect, useRef, useState } from "react";
import { copyText, useCopied } from "./CopyButton";
import s from "./detail.module.css";

type Props = {
  slug: string;
  markdown: string;
  spec: string;
  css: string;
  json: string;
};

export function CopyMenu({ slug, markdown, spec, css, json }: Props) {
  const [copied, copy] = useCopied();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const hasFrontmatter = spec.length < markdown.length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const item = (label: string, text: string, hint: string) => (
    <button
      type="button"
      className={s.menuItem}
      onClick={() =>
        copyText(text).then(() => {
          setFlash(label);
          setTimeout(() => {
            setFlash(null);
            setOpen(false);
          }, 900);
        })
      }
    >
      <span>{flash === label ? "Copied ✓" : label}</span>
      <small>{hint}</small>
    </button>
  );

  return (
    <div className={s.actions} ref={ref}>
      <div className={s.split}>
        <button type="button" className={s.btnPrimary} onClick={() => copy(markdown)}>
          {copied ? "Copied ✓" : "Copy DESIGN.md"}
        </button>
        <button
          type="button"
          className={`${s.btnPrimary} ${s.splitToggle}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="More copy options"
          aria-expanded={open}
        >
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
            <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" fill="none" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
      {open && (
        <div className={s.menu} role="menu">
          {hasFrontmatter ? (
            <>
              {item("DESIGN.md", markdown, "Full file with YAML tokens")}
              {item("Spec only", spec, "Markdown body, no frontmatter")}
            </>
          ) : (
            item("DESIGN.md", markdown, "Full markdown spec")
          )}
          {item("CSS variables", css, ":root { --color-… }")}
          {item(
            "Tokens JSON",
            json,
            hasFrontmatter ? "Colors, type, radius, spacing, components" : "Palette extracted from the prose",
          )}
          <div className={s.menuSep} />
          <a className={s.menuItem} href={`/raw/${slug}`} download="DESIGN.md">
            <span>Download DESIGN.md</span>
            <small>Save the file</small>
          </a>
        </div>
      )}
    </div>
  );
}

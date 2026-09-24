"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DesignSummary } from "@/lib/designs";
import s from "./sidebar.module.css";

type Props = {
  designs: DesignSummary[];
  categories: string[];
  fetchedAt: string;
};

export function Sidebar({ designs, categories, fetchedAt }: Props) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const input = useRef<HTMLInputElement>(null);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA/.test(target.tagName)) {
        e.preventDefault();
        setOpen(true);
        input.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === input.current) {
        setQuery("");
        input.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile drawer whenever navigation happens.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (d: DesignSummary) =>
      !q || `${d.name} ${d.category} ${d.tagline}`.toLowerCase().includes(q);
    return categories
      .map((c) => ({ category: c, items: designs.filter((d) => d.category === c && match(d)) }))
      .filter((g) => g.items.length);
  }, [designs, categories, query]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const activeSlug = pathname.startsWith("/design/") ? pathname.split("/")[2] : null;

  // Keep the active design visible in the (independently scrolling) list.
  useEffect(() => {
    const list = nav.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: top - list.clientHeight / 3 });
    }
  }, [activeSlug]);

  return (
    <>
      <button className={s.burger} onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
        <span />
        <span />
        <span />
      </button>
      {open && <div className={s.scrim} onClick={() => setOpen(false)} />}

      <aside className={`${s.sidebar} ${open ? s.open : ""}`}>
        <Link href="/" className={s.brand}>
          <span className={s.brandMark} aria-hidden>
            {/* Same mark and colours as app/icon.svg, minus the tile (brandMark draws it). */}
            <svg viewBox="0 0 32 32">
              <rect x="6" y="4" width="20" height="22" rx="2" fill="#18181b" />
              <rect x="8" y="4" width="2" height="22" fill="#fbfbfa" />
              <path d="M18 4h4v26l-2-2-2 2z" fill="#10b981" />
            </svg>
          </span>
          <strong>The Book</strong>
        </Link>

        <div className={s.search}>
          <svg viewBox="0 0 20 20" aria-hidden>
            <path
              d="M9 3.5a5.5 5.5 0 1 0 3.47 9.77l3.63 3.63 1.06-1.06-3.63-3.63A5.5 5.5 0 0 0 9 3.5Zm-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
              fill="currentColor"
            />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search designs…"
            aria-label="Search designs"
          />
          <kbd>/</kbd>
        </div>

        <nav ref={nav} className={s.nav}>
          <Link href="/" className={`${s.item} ${pathname === "/" ? s.active : ""}`}>
            <span className={s.gridIcon} aria-hidden />
            All designs
          </Link>

          {groups.map(({ category, items }) => {
            const isCollapsed = collapsed[category] && !query;
            return (
              <div key={category} className={s.group}>
                <button
                  className={s.groupHead}
                  onClick={() => setCollapsed((c) => ({ ...c, [category]: !c[category] }))}
                  aria-expanded={!isCollapsed}
                >
                  <span>{category}</span>
                  <em>{items.length}</em>
                  <svg viewBox="0 0 12 12" className={isCollapsed ? s.chevClosed : ""} aria-hidden>
                    <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
                  </svg>
                </button>
                {!isCollapsed &&
                  items.map((d) => (
                    <Link
                      key={d.slug}
                      href={`/design/${d.slug}`}
                      className={`${s.item} ${activeSlug === d.slug ? s.active : ""}`}
                      aria-current={activeSlug === d.slug ? "page" : undefined}
                      title={d.tagline}
                    >
                      <span
                        className={s.dot}
                        style={{ background: d.primary, boxShadow: `inset 0 0 0 3px ${d.canvas}` }}
                        aria-hidden
                      />
                      {d.name}
                    </Link>
                  ))}
              </div>
            );
          })}

          {total === 0 && <p className={s.empty}>No designs match “{query}”.</p>}
        </nav>

        <footer className={s.footer}>
          <span>
            Synced{" "}
            {new Date(fetchedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <small className={s.license}>MIT License · Copyright (c) 2026 VoltAgent</small>
        </footer>
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import s from "./gallery.module.css";

export type GalleryCard = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  hasTokens: boolean;
  theme: {
    canvas: string;
    surface: string;
    ink: string;
    muted: string;
    primary: string;
    onPrimary: string;
    hairline: string;
    display: string;
    displayWeight: string;
    buttonRadius: string;
    swatches: string[];
  };
};

export function Gallery({ cards, categories }: { cards: GalleryCard[]; categories: string[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter(
      (c) =>
        (!filter || c.category === filter) &&
        (!q || `${c.name} ${c.category} ${c.tagline}`.toLowerCase().includes(q)),
    );
  }, [cards, filter, query]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of cards) m[c.category] = (m[c.category] || 0) + 1;
    return m;
  }, [cards]);

  return (
    <section>
      <div className={s.toolbar}>
        <div className={s.chips}>
          <button className={!filter ? s.chipOn : s.chip} onClick={() => setFilter(null)}>
            All <em>{cards.length}</em>
          </button>
          {categories
            .filter((c) => counts[c])
            .map((c) => (
              <button
                key={c}
                className={filter === c ? s.chipOn : s.chip}
                onClick={() => setFilter(filter === c ? null : c)}
              >
                {c} <em>{counts[c]}</em>
              </button>
            ))}
        </div>
        <input
          className={s.filter}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter…"
          aria-label="Filter designs"
        />
      </div>

      <div className={s.grid}>
        {visible.map((c) => {
          const t = c.theme;
          return (
            <Link key={c.slug} href={`/design/${c.slug}`} className={s.card}>
              <div
                className={s.thumb}
                style={{ background: t.canvas, color: t.ink, borderColor: t.hairline }}
              >
                <div className={s.thumbTop}>
                  <span className={s.aa} style={{ fontFamily: t.display, fontWeight: +t.displayWeight || 600 }}>
                    Aa
                  </span>
                  <span
                    className={s.btn}
                    style={{ background: t.primary, color: t.onPrimary, borderRadius: t.buttonRadius }}
                  >
                    Get started
                  </span>
                </div>
                <div className={s.lines} aria-hidden>
                  <span style={{ background: t.ink }} />
                  <span style={{ background: t.muted }} />
                  <span style={{ background: t.muted }} />
                </div>
                <div className={s.swatches}>
                  {t.swatches.map((sw, i) => (
                    <span key={i} style={{ background: sw }} title={sw} />
                  ))}
                </div>
              </div>
              <div className={s.meta}>
                <div className={s.nameRow}>
                  <strong>{c.name}</strong>
                  {!c.hasTokens && <span className={s.tag}>prose</span>}
                </div>
                <small>{c.category}</small>
                <p>{c.tagline}</p>
              </div>
            </Link>
          );
        })}
      </div>
      {!visible.length && <p className={s.empty}>No designs match your filter.</p>}
    </section>
  );
}

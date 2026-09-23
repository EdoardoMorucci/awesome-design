"use client";

import { useState } from "react";
import s from "./detail.module.css";

const DEVICES = [
  ["Desktop", "100%"],
  ["Tablet", "820px"],
  ["Mobile", "390px"],
] as const;

export function PreviewFrame({ slug, name }: { slug: string; name: string }) {
  const [width, setWidth] = useState<string>("100%");
  const src = `/preview/${slug}`;

  return (
    <div className={s.previewWrap}>
      <div className={s.previewBar}>
        <div className={s.segmented} role="radiogroup" aria-label="Viewport">
          {DEVICES.map(([label, w]) => (
            <button
              key={label}
              role="radio"
              aria-checked={width === w}
              className={width === w ? s.segOn : s.seg}
              onClick={() => setWidth(w)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={s.previewNote}>
          Generated from the DESIGN.md tokens — not a screenshot of the real site
        </span>
        <a className={s.btnGhost} href={src} target="_blank" rel="noreferrer">
          Open full page ↗
        </a>
      </div>
      <div className={s.stage}>
        <iframe
          key={slug}
          src={src}
          title={`${name} preview`}
          className={s.frame}
          style={{ width }}
        />
      </div>
    </div>
  );
}

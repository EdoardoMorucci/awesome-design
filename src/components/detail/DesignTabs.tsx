"use client";

import { useEffect, useState, type ReactNode } from "react";
import s from "./detail.module.css";

const TABS = [
  ["preview", "Preview"],
  ["spec", "Spec"],
  ["tokens", "Tokens"],
] as const;
type Tab = (typeof TABS)[number][0];

export function DesignTabs(props: Record<Tab, ReactNode> & { header: ReactNode; tokenCount: number }) {
  const [tab, setTab] = useState<Tab>("preview");

  // Tabs are addressable via the URL hash (#spec, #tokens).
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (TABS.some(([k]) => k === h)) setTab(h as Tab);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const select = (t: Tab) => {
    // Panels share the window's scroll; start each tab from the top instead of
    // inheriting the previous tab's offset.
    window.scrollTo({ top: 0, behavior: "instant" });
    setTab(t);
    history.replaceState(null, "", t === "preview" ? window.location.pathname : `#${t}`);
  };

  return (
    <>
      <header className={s.header}>
        {props.header}
        <div className={s.tabs} role="tablist">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              className={tab === key ? s.tabOn : s.tab}
              onClick={() => select(key)}
            >
              {label}
              {key === "tokens" && props.tokenCount > 0 && <em>{props.tokenCount}</em>}
            </button>
          ))}
        </div>
      </header>
      <div className={s.panel} hidden={tab !== "preview"}>
        {props.preview}
      </div>
      <div className={s.panel} hidden={tab !== "spec"}>
        {props.spec}
      </div>
      <div className={s.panel} hidden={tab !== "tokens"}>
        {props.tokens}
      </div>
    </>
  );
}

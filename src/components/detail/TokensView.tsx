import type { CSSProperties } from "react";
import * as yaml from "js-yaml";
import type { Design } from "@/lib/designs";
import { CopyButton, Swatch } from "./CopyButton";
import s from "./detail.module.css";

function makeResolver(design: Design) {
  const resolve = (v: unknown, depth = 0): unknown => {
    if (typeof v !== "string" || depth > 5 || !design.tokens) return v;
    const m = v.match(/^\{([\w-]+)\.([\w.-]+)\}$/);
    if (!m) return v;
    const group = (design.tokens as Record<string, Record<string, unknown>>)[m[1]];
    return resolve(group?.[m[2]], depth + 1);
  };
  return resolve;
}

const px = (v: unknown) => (typeof v === "number" ? `${v}px` : typeof v === "string" ? v : undefined);
const isColor = (v: unknown): v is string =>
  typeof v === "string" && /^(#|rgb|hsl|transparent|linear-gradient)/i.test(v.trim());

function typeStyle(t: Record<string, unknown> | undefined): CSSProperties {
  if (!t) return {};
  return {
    fontSize: px(t.fontSize),
    fontWeight: t.fontWeight as CSSProperties["fontWeight"],
    lineHeight: t.lineHeight as CSSProperties["lineHeight"],
    letterSpacing: px(t.letterSpacing),
    textTransform: t.textTransform as CSSProperties["textTransform"],
  };
}

export function TokensView({ design }: { design: Design }) {
  const resolve = makeResolver(design);
  const tokens = design.tokens;
  const t = design.theme;

  const groups = new Map<string, { name: string; value: string }[]>();
  for (const p of design.palette) {
    const g = p.group || "Colors";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push({ name: p.name, value: p.value });
  }

  const components = Object.entries(tokens?.components ?? {}).filter(
    ([, c]) => c && (c.backgroundColor || c.textColor),
  );

  return (
    <div className={s.tokens}>
      <section>
        <header className={s.tokHead}>
          <h2>Colors</h2>
          <span>{design.palette.length} tokens · click to copy</span>
        </header>
        {[...groups].map(([group, items]) => (
          <div key={group} className={s.tokGroup}>
            {groups.size > 1 && <h3>{group}</h3>}
            <div className={s.swatches}>
              {items.map((c) => (
                <Swatch key={c.name + c.value} name={c.name} value={c.value} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <header className={s.tokHead}>
          <h2>Typography</h2>
          <span>
            Rendered with the declared stack · loaded substitute:{" "}
            {t.fonts.google.length ? t.fonts.google.join(", ") : "system fonts"}
          </span>
        </header>
        {tokens && Object.keys(tokens.typography).length ? (
          <div className={s.typeList}>
            {Object.entries(tokens.typography).map(([name, ty]) => (
              <div key={name} className={s.typeRow}>
                <div className={s.typeMeta}>
                  <code>{name}</code>
                  <small>
                    {[
                      px(ty.fontSize),
                      ty.fontWeight,
                      ty.lineHeight && `lh ${ty.lineHeight}`,
                      ty.letterSpacing !== undefined && `ls ${px(ty.letterSpacing)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                  <small className={s.fam}>{String(ty.fontFamily ?? "")}</small>
                </div>
                <p
                  style={{
                    ...typeStyle(ty),
                    // Declared stack first, then the loadable substitute.
                    fontFamily: [ty.fontFamily, t.fonts.body].filter(Boolean).join(", "),
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className={s.typeList}>
            {(
              [
                ["Display", t.fonts.display, t.type.display],
                ["Body", t.fonts.body, t.type.body],
              ] as const
            ).map(([label, fam, ty]) => (
              <div key={label} className={s.typeRow}>
                <div className={s.typeMeta}>
                  <code>{label}</code>
                  <small>
                    {ty.size} · {ty.weight}
                  </small>
                  <small className={s.fam}>{fam}</small>
                </div>
                <p
                  style={{
                    fontFamily: fam,
                    fontSize: ty.size,
                    fontWeight: ty.weight as CSSProperties["fontWeight"],
                    lineHeight: ty.lineHeight,
                    letterSpacing: ty.letterSpacing,
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            ))}
            <p className={s.note}>
              This DESIGN.md has no YAML tokens — values were extracted from the prose. See the Spec tab for
              the full type hierarchy.
            </p>
          </div>
        )}
      </section>

      {tokens && (Object.keys(tokens.rounded).length > 0 || Object.keys(tokens.spacing).length > 0) && (
        <section className={s.twoCol}>
          <div>
            <header className={s.tokHead}>
              <h2>Radius</h2>
            </header>
            <div className={s.radii}>
              {Object.entries(tokens.rounded).map(([k, v]) => {
                const r = px(resolve(v));
                return (
                  <div key={k}>
                    <span style={{ borderRadius: r, borderColor: t.primary }} />
                    <code>{k}</code>
                    <small>{r}</small>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <header className={s.tokHead}>
              <h2>Spacing</h2>
            </header>
            <div className={s.spacing}>
              {Object.entries(tokens.spacing).map(([k, v]) => {
                const sp = px(resolve(v));
                return (
                  <div key={k}>
                    <code>{k}</code>
                    <span style={{ width: `min(${sp}, 100%)`, background: t.primary }} />
                    <small>{sp}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {components.length > 0 && (
        <section>
          <header className={s.tokHead}>
            <h2>Components</h2>
            <span>{components.length} specs · rendered from tokens · click “YAML” to copy</span>
          </header>
          <div className={s.components} style={{ background: t.canvas, color: t.ink }}>
            {components.map(([name, c]) => {
              const bg = resolve(c.backgroundColor);
              const fg = resolve(c.textColor);
              const typo = resolve(c.typography);
              const border = resolve(c.border);
              const borderColor = resolve(c.borderColor);
              const style: CSSProperties = {
                ...typeStyle(
                  typo && typeof typo === "object" ? (typo as Record<string, unknown>) : undefined,
                ),
                fontFamily: t.fonts.body,
                background: isColor(bg) ? bg : "transparent",
                color: isColor(fg) ? fg : t.ink,
                borderRadius: px(resolve(c.rounded)),
                padding: px(resolve(c.padding)) ?? "10px 16px",
                // Outline token-less transparent specs so they don't vanish into the canvas.
                border:
                  typeof border === "string"
                    ? border
                    : isColor(borderColor)
                      ? `1px solid ${borderColor}`
                      : isColor(bg) && bg !== "transparent"
                        ? "1px solid transparent"
                        : `1px dashed ${t.hairline}`,
                minHeight: px(resolve(c.height)),
              };
              return (
                <div key={name} className={s.compCell}>
                  <div className={s.compStage}>
                    <span className={s.compSample} style={style}>
                      {name.replace(/-/g, " ")}
                    </span>
                  </div>
                  <div className={s.compMeta} style={{ borderColor: t.hairline }}>
                    <code>{name}</code>
                    <CopyButton text={yaml.dump({ [name]: c }, { lineWidth: 120 })} variant="ghost">
                      YAML
                    </CopyButton>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

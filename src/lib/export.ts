import type { Design } from "./designs";

const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

function resolve(design: Design, v: unknown, depth = 0): unknown {
  if (typeof v !== "string" || depth > 5) return v;
  const m = v.match(/^\{([\w-]+)\.([\w.-]+)\}$/);
  if (!m || !design.tokens) return v;
  const group = (design.tokens as Record<string, Record<string, unknown>>)[m[1]];
  return resolve(design, group?.[m[2]], depth + 1);
}

const cssValue = (v: unknown) =>
  typeof v === "number" ? (v === 0 ? "0" : `${v}px`) : String(v);

/** Design tokens as a `:root { --… }` block. */
export function toCssVariables(design: Design): string {
  const lines: string[] = [];
  const push = (name: string, v: unknown) => {
    if (v === undefined || v === null || typeof v === "object") return;
    lines.push(`  --${name}: ${cssValue(v)};`);
  };

  if (design.tokens) {
    const { colors, rounded, spacing, typography } = design.tokens;
    lines.push("  /* colors */");
    for (const [k, v] of Object.entries(colors)) push(`color-${kebab(k)}`, resolve(design, v));
    lines.push("", "  /* radius */");
    for (const [k, v] of Object.entries(rounded)) push(`radius-${kebab(k)}`, resolve(design, v));
    lines.push("", "  /* spacing */");
    for (const [k, v] of Object.entries(spacing)) push(`space-${kebab(k)}`, resolve(design, v));
    lines.push("", "  /* typography */");
    for (const [k, t] of Object.entries(typography)) {
      const n = kebab(k);
      push(`font-${n}-family`, t.fontFamily);
      push(`font-${n}-size`, t.fontSize);
      push(`font-${n}-weight`, t.fontWeight);
      push(`font-${n}-line-height`, t.lineHeight);
      push(`font-${n}-letter-spacing`, t.letterSpacing);
    }
  } else {
    lines.push("  /* colors (extracted from prose) */");
    const seen = new Set<string>();
    for (const p of design.palette) {
      let name = `color-${kebab(p.name)}`;
      while (seen.has(name)) name += "-alt";
      seen.add(name);
      push(name, p.value);
    }
    const t = design.theme;
    lines.push("", "  /* typography */");
    push("font-display", t.fonts.display);
    push("font-body", t.fonts.body);
  }

  return `/* ${design.name} — generated from DESIGN.md */\n:root {\n${lines.join("\n")}\n}\n`;
}

/** Design tokens as JSON (frontmatter tokens, or the extracted palette). */
export function toJson(design: Design): string {
  const data = design.tokens
    ? { name: design.name, ...design.tokens }
    : {
        name: design.name,
        colors: Object.fromEntries(design.palette.map((p) => [p.name, p.value])),
        fonts: { display: design.theme.fonts.display, body: design.theme.fonts.body },
      };
  return JSON.stringify(data, null, 2);
}

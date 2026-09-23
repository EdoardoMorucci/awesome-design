// Downloads github.com/VoltAgent/awesome-design-md and compiles every
// design-md/<id>/DESIGN.md into .designs/designs.json for the app.
//
// Runs automatically before `dev` and `build`. Env overrides:
//   DESIGNS_REPO_DIR  use a local checkout instead of downloading
//   DESIGNS_REF       branch or tag to download (default: main)
//   DESIGNS_OFFLINE=1 skip download, reuse the existing .designs/designs.json
// Flags:
//   --if-missing      only download when .designs/designs.json doesn't exist yet

import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import zlib from "node:zlib";
import * as tar from "tar";
import * as yaml from "js-yaml";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, ".designs");
const OUT_FILE = path.join(OUT_DIR, "designs.json");
const REPO = "VoltAgent/awesome-design-md";
const REF = process.env.DESIGNS_REF || "main";

async function download() {
  const dest = path.join(OUT_DIR, "repo");
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const url = `https://codeload.github.com/${REPO}/tar.gz/refs/heads/${REF}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  await pipeline(
    Readable.fromWeb(res.body),
    zlib.createGunzip(),
    tar.x({
      cwd: dest,
      strip: 1,
      filter: (p) => /\/(README\.md|design-md\/[^/]+\/DESIGN\.md)$/.test(p),
    }),
  );
  return dest;
}

// ---------------------------------------------------------------- README

function parseReadme(md) {
  const meta = {};
  let category = null;
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^###\s+(.+?)\s*$/);
    if (h) {
      category = h[1].replace(/\s*·.*$/, "").trim();
      continue;
    }
    const item = line.match(
      /^-\s+\[\*\*(.+?)\*\*\]\(https:\/\/getdesign\.md\/([^/]+)\/design-md\)\s*-\s*(.+)$/,
    );
    if (item && category) {
      meta[item[2]] = { name: item[1], category, tagline: item[3].trim() };
    }
  }
  return meta;
}

// ---------------------------------------------------------------- DESIGN.md

// Some upstream frontmatters have unquoted values containing ": ", which is
// invalid YAML. Quote those scalars before parsing.
function repairYaml(src) {
  return src
    .split(/\r?\n/)
    .map((line) => {
      const m = line.match(/^(\s*[^\s:#][^\s:]*):\s+(.+)$/);
      if (!m) return line;
      const v = m[2];
      if (/^["'[{|>]/.test(v) || !/: |\s#/.test(v)) return line;
      return `${m[1]}: ${JSON.stringify(v)}`;
    })
    .join("\n");
}

function splitFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { tokens: null, body: md };
  let tokens = null;
  try {
    tokens = yaml.load(repairYaml(m[1]));
  } catch (e) {
    console.warn(`  ! frontmatter parse failed: ${e.message.split("\n")[0]}`);
  }
  return { tokens, body: md.slice(m[0].length) };
}

function sections(body) {
  const out = [];
  let cur = null;
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^##\s+(?:\d+\.\s+)?(.+?)\s*$/);
    if (h && !line.startsWith("###")) {
      cur = { title: h[1], content: "" };
      out.push(cur);
    } else if (cur) {
      cur.content += line + "\n";
    }
  }
  return out.map((s) => ({ ...s, content: s.content.trim() }));
}

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;

// Legacy (prose-only) files: pull "**Name** (`#hex`)" pairs grouped by ### heading.
function prosePalette(body) {
  const out = [];
  const seen = new Set();
  let group = "";
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^###\s+(.+)/);
    if (h) group = h[1].trim();
    if (/^##\s/.test(line) && !/colou?r/i.test(line)) group = group && "";
    const re = /\*\*([^*]+)\*\*\s*\((?:`)?(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))(?:`)?/g;
    let m;
    while ((m = re.exec(line))) {
      const name = m[1].trim();
      const value = m[2].toLowerCase();
      const key = name + value;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name, value, group });
    }
  }
  return out;
}

function proseFonts(body) {
  const sec = body.match(/###\s+Font Family([\s\S]*?)(?:\n###?\s)/);
  const text = sec ? sec[1] : "";
  const role = (re) => {
    const line = text.split("\n").find((l) => re.test(l));
    const m = line && line.match(/`([^`]+)`/);
    return m ? m[1] : null;
  };
  return {
    display: role(/display|headline|heading/i),
    body: role(/text|body|ui|primary/i),
    mono: role(/mono|code/i),
  };
}

// ---------------------------------------------------------------- tokens → theme

function resolver(tokens) {
  const resolve = (v, depth = 0) => {
    if (typeof v !== "string" || depth > 5) return v;
    const m = v.match(/^\{([\w-]+)\.([\w.-]+)\}$/);
    if (!m) return v;
    const hit = tokens?.[m[1]]?.[m[2]];
    return hit === undefined ? undefined : resolve(hit, depth + 1);
  };
  return resolve;
}

function rgb(color) {
  if (typeof color !== "string") return null;
  let m = color.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function luminance(color) {
  const c = rgb(color);
  if (!c) return null;
  const [r, g, b] = c.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation(color) {
  const c = rgb(color);
  if (!c) return 0;
  const max = Math.max(...c);
  const min = Math.min(...c);
  return max === 0 ? 0 : (max - min) / max;
}

const isColor = (v) =>
  typeof v === "string" && (HEX.test(v) || /^(rgb|hsl)a?\(/i.test(v));

function contrastOn(bg) {
  const l = luminance(bg);
  return l !== null && l < 0.45 ? "#ffffff" : "#111111";
}

const GOOGLE_FONTS = [
  "Inter", "Inter Tight", "Geist", "Geist Mono", "Roboto", "Roboto Mono", "Roboto Flex",
  "IBM Plex Sans", "IBM Plex Mono", "IBM Plex Serif", "JetBrains Mono", "DM Sans", "DM Mono",
  "DM Serif Display", "Manrope", "Space Grotesk", "Space Mono", "Poppins", "Montserrat",
  "Open Sans", "Noto Sans", "Noto Serif", "Work Sans", "Figtree", "Plus Jakarta Sans", "Outfit",
  "Instrument Sans", "Instrument Serif", "Fira Code", "Fira Sans", "Source Code Pro",
  "Source Sans 3", "Source Serif 4", "Nunito", "Nunito Sans", "Rubik", "Barlow",
  "Barlow Condensed", "Archivo", "Oswald", "Bebas Neue", "EB Garamond", "Cormorant Garamond",
  "Libre Baskerville", "Merriweather", "PT Serif", "Playfair Display", "Lora", "Karla", "Sora",
  "Lexend", "Urbanist", "Albert Sans", "Hanken Grotesk", "Public Sans", "Red Hat Display",
  "Red Hat Text", "Mona Sans", "Hubot Sans", "Onest", "Schibsted Grotesk", "Bricolage Grotesque",
  "Anton", "Archivo Black", "Libre Franklin", "Lato", "Raleway", "Mulish", "Heebo", "Epilogue",
  "Syne", "Unbounded", "Chivo", "Chivo Mono", "Ubuntu", "Ubuntu Mono", "Cabin", "Josefin Sans",
  "Tinos", "Arimo", "Cousine", "VT323", "Press Start 2P", "Silkscreen", "Pixelify Sans",
];
const GOOGLE_BY_LOWER = new Map(GOOGLE_FONTS.map((f) => [f.toLowerCase(), f]));

function families(stack) {
  if (typeof stack !== "string") return [];
  return stack
    .split(",")
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

// Pick a Google font we can actually load: first from the declared stack,
// otherwise the first Google font the prose mentions as a substitute.
function withGoogleFallback(stack, prose, fallback) {
  const fams = families(stack);
  const inStack = fams.map((f) => GOOGLE_BY_LOWER.get(f.toLowerCase())).find(Boolean);
  let google = inStack;
  if (!google) {
    for (const f of GOOGLE_FONTS) {
      const re = new RegExp(`\\b${f.replace(/ /g, "\\s")}\\b`);
      if (re.test(prose)) {
        google = f;
        break;
      }
    }
  }
  const quoted = fams.map((f) => (/[\s\d]/.test(f) && !/^(ui|system)-/.test(f) ? `"${f}"` : f));
  if (google && !inStack) quoted.splice(Math.min(1, quoted.length), 0, `"${google}"`);
  if (!quoted.length) quoted.push(...(google ? [`"${google}"`] : []));
  quoted.push(fallback);
  return { stack: [...new Set(quoted)].join(", "), google };
}

function pickKey(obj, names) {
  if (!obj) return undefined;
  for (const n of names) {
    if (n instanceof RegExp) {
      const k = Object.keys(obj).find((key) => n.test(key));
      if (k) return k;
    } else if (obj[n] !== undefined) return n;
  }
  return undefined;
}

function px(v, fallback) {
  if (typeof v === "number") return `${v}px`;
  if (typeof v === "string" && v.trim()) return v.trim();
  return fallback;
}

function buildTheme({ tokens, palette, fonts, body }) {
  const resolve = resolver(tokens);
  const colors = {};
  if (tokens?.colors) {
    for (const [k, v] of Object.entries(tokens.colors)) {
      const r = resolve(v);
      if (isColor(r)) colors[k] = r;
    }
  } else {
    for (const p of palette) {
      const key = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (!colors[key]) colors[key] = p.value;
    }
  }
  const comps = tokens?.components || {};
  const comp = (names) => {
    const k = pickKey(comps, names);
    if (!k) return {};
    const out = {};
    for (const [p, v] of Object.entries(comps[k] || {})) out[p] = resolve(v);
    return out;
  };
  const c = (names) => {
    const k = pickKey(colors, names);
    return k ? colors[k] : undefined;
  };
  const byGroup = (re) => palette.filter((p) => re.test(p.group)).map((p) => p.value);

  const btn = comp(["button-primary", "button-primary-default", /^button-primary/, /^cta-primary/, /^button/]);
  const btn2 = comp(["button-secondary", "button-outline", "button-ghost", /^button-secondary/]);
  const input = comp(["text-input", "input", /^text-input/, /input/]);
  const card = comp(["feature-card", "card-feature", "card", /card/]);
  const darkBand = comp(["hero-band-dark", "footer-dark", /dark/]);
  const footer = comp(["footer", "footer-region", /^footer/]);

  const legacyCanvas = byGroup(/surface|background|canvas/i);
  const legacyText = byGroup(/neutral|text/i);
  const legacyPrimary = byGroup(/primary|brand/i);

  let canvas =
    c(["canvas", "background", "bg", "canvas-light", "surface", "page", /^canvas/, /background/]) ||
    legacyCanvas[0] ||
    "#ffffff";
  const dark = (luminance(canvas) ?? 1) < 0.2;

  let ink =
    c(["ink", "text", "foreground", "ink-deep", "text-primary", "heading", /^ink/, /^text/]) ||
    legacyText[0];
  if (!ink || Math.abs((luminance(ink) ?? 0) - (luminance(canvas) ?? 1)) < 0.3) {
    ink = dark ? c(["on-dark", "white", /^on-dark/]) || "#f5f5f5" : "#111111";
  }
  const muted =
    c(["muted", "mute", "body", "ink-muted", "text-secondary", "ash", "stone", "slate", /mut/]) ||
    legacyText[1] ||
    ink;

  const primaryRaw =
    (isColor(btn.backgroundColor) && btn.backgroundColor) ||
    c(["primary", "brand", "accent", /^primary/, /^brand/, /^accent/]) ||
    legacyPrimary.find((v) => saturation(v) > 0.2) ||
    legacyPrimary[0] ||
    palette.find((p) => saturation(p.value) > 0.35)?.value ||
    ink;
  // A primary that vanishes into the canvas (black-on-black, white-on-white)
  // is usually an outlined/inverted CTA; fall back to the ink colour.
  const invisible =
    Math.abs((luminance(primaryRaw) ?? 0) - (luminance(canvas) ?? 1)) < 0.12;
  const primary = invisible ? ink : primaryRaw;
  let onPrimary = invisible
    ? contrastOn(primary)
    : (isColor(btn.textColor) && btn.textColor) || c(["on-primary"]) || contrastOn(primary);
  if (Math.abs((luminance(onPrimary) ?? 0) - (luminance(primary) ?? 0)) < 0.2)
    onPrimary = contrastOn(primary);

  const isDarkish = (v) => isColor(v) && (luminance(v) ?? 1) < 0.2;
  const darkCandidates = [
    darkBand.backgroundColor,
    ...["surface-dark", "canvas-dark", "inverse-canvas", "ink-deep"].map((k) => colors[k]),
    ...Object.entries(colors)
      .filter(([k]) => /dark/.test(k) && !/^on-|text|ink/.test(k))
      .map(([, v]) => v),
    ...(dark ? [colors["surface-elevated"], colors["surface-1"], colors["surface-card"]] : []),
    ink,
  ];
  const surfaceDark =
    (dark
      ? darkCandidates.find((v) => isDarkish(v) && v !== canvas)
      : darkCandidates.find(isDarkish)) || "#111111";
  let onDark = c(["on-dark", "inverse-ink", /^on-dark/]) || contrastOn(surfaceDark);
  if (Math.abs((luminance(onDark) ?? 0) - (luminance(surfaceDark) ?? 0)) < 0.3)
    onDark = contrastOn(surfaceDark);

  const accents = [];
  for (const [k, v] of Object.entries(colors)) {
    if (/accent|brand|highlight|tag|chart|luxe|plus/.test(k) && saturation(v) > 0.25 && v !== primary)
      accents.push(v);
  }
  for (const p of palette) if (saturation(p.value) > 0.35 && p.value !== primary) accents.push(p.value);

  const typo = tokens?.typography || {};
  const t = (names) => {
    const k = pickKey(typo, names);
    return k ? typo[k] : {};
  };
  const tDisplay = t(["display-xl", "display-xxl", "hero-display", "display-lg", "heading-1", /^display/, /^heading/]);
  const tH2 = t(["display-md", "display-lg", "heading-lg", "heading-2", "heading-md", /^heading/, /^title/]);
  const tH3 = t(["title-md", "heading-sm", "heading-md", "display-sm", "heading-3", /^title/, /card-title/]);
  const tBody = t(["body-md", "body", "body-lg", /^body/]);
  const tEyebrow = t(["caption-uppercase", "eyebrow", "eyebrow-uppercase", "micro-uppercase", "micro-cap", /uppercase/, "caption"]);
  const tButton = (btn.typography && typeof btn.typography === "object" ? btn.typography : null) ||
    t(["button-md", "button", "button-lg", /^button/]);
  const tMono = t(["code", "code-md", "code-sm", /code|mono/]);

  const prose = (body.match(/###\s+Font[\s\S]*?(?=\n##\s)/g) || []).join("\n");
  const display = withGoogleFallback(tDisplay.fontFamily || fonts.display || fonts.body, prose, "system-ui, sans-serif");
  const bodyFont = withGoogleFallback(tBody.fontFamily || fonts.body || fonts.display, prose, "system-ui, sans-serif");
  const mono = withGoogleFallback(tMono.fontFamily || fonts.mono || "JetBrains Mono", "", "ui-monospace, monospace");

  const style = (tk, d) => ({
    size: px(tk.fontSize, d.size),
    weight: String(tk.fontWeight ?? d.weight),
    lineHeight: String(tk.lineHeight ?? d.lineHeight),
    letterSpacing: px(tk.letterSpacing, "normal"),
    transform: tk.textTransform || "none",
  });

  const rounded = tokens?.rounded || {};
  const r = (names, d) => {
    const k = pickKey(rounded, names);
    return px(k ? resolve(rounded[k]) : undefined, d);
  };

  return {
    mode: dark ? "dark" : "light",
    canvas,
    surface:
      (isColor(card.backgroundColor) && card.backgroundColor !== canvas && card.backgroundColor) ||
      c(["surface-card", "surface-soft", "canvas-soft", "surface", "surface-1", "surface-elevated", /^surface/]) ||
      legacyCanvas[1] ||
      canvas,
    ink,
    body: c(["body", "ink-soft", "text-secondary", "charcoal"]) || ink,
    muted,
    hairline:
      c(["hairline", "border", "hairline-soft", "divider", "stroke", /hairline|border|divider/]) ||
      (dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"),
    primary,
    onPrimary,
    secondaryBg: (isColor(btn2.backgroundColor) && btn2.backgroundColor) || "transparent",
    secondaryText: (isColor(btn2.textColor) && btn2.textColor) || ink,
    secondaryBorder:
      (typeof btn2.border === "string" && btn2.border) ||
      (isColor(btn2.borderColor) ? `1px solid ${btn2.borderColor}` : `1px solid ${ink}33`),
    surfaceDark,
    onDark,
    footerBg: (isColor(footer.backgroundColor) && footer.backgroundColor) || canvas,
    footerText: (isColor(footer.textColor) && footer.textColor) || muted,
    inputBg: (isColor(input.backgroundColor) && input.backgroundColor) || canvas,
    inputText: (isColor(input.textColor) && input.textColor) || ink,
    inputBorder:
      (typeof input.border === "string" && input.border) ||
      (isColor(input.borderColor) ? `1px solid ${input.borderColor}` : null),
    accents: [...new Set(accents)].slice(0, 4),
    fonts: {
      display: display.stack,
      body: bodyFont.stack,
      mono: mono.stack,
      google: [...new Set([display.google, bodyFont.google, mono.google].filter(Boolean))],
    },
    type: {
      display: style(tDisplay, { size: "56px", weight: 600, lineHeight: 1.05 }),
      h2: style(tH2, { size: "36px", weight: 600, lineHeight: 1.15 }),
      h3: style(tH3, { size: "20px", weight: 600, lineHeight: 1.3 }),
      body: style(tBody, { size: "16px", weight: 400, lineHeight: 1.55 }),
      eyebrow: style(tEyebrow, { size: "12px", weight: 600, lineHeight: 1.3 }),
      button: style(tButton, { size: "15px", weight: 500, lineHeight: 1 }),
    },
    radius: {
      button: px(btn.rounded, r(["md", "sm", "base"], "8px")),
      card: px(card.rounded, r(["lg", "md", "xl"], "12px")),
      input: px(input.rounded, r(["sm", "md", "base"], "8px")),
      pill: r(["full", "pill"], "9999px"),
    },
    button: {
      padding: px(btn.padding, "12px 22px"),
      height: px(btn.height, "auto"),
    },
    shadow: typeof card.shadow === "string" ? card.shadow : "none",
  };
}

// ---------------------------------------------------------------- main

function titleCase(id) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  const reuse = process.env.DESIGNS_OFFLINE || process.argv.includes("--if-missing");
  if (reuse && fs.existsSync(OUT_FILE) && !process.env.DESIGNS_REPO_DIR) {
    console.log("[designs] reusing .designs/designs.json (run `npm run designs` to refresh)");
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let repoDir = process.env.DESIGNS_REPO_DIR;
  if (!repoDir) {
    try {
      console.log(`[designs] downloading ${REPO}@${REF} …`);
      repoDir = await download();
    } catch (e) {
      if (fs.existsSync(OUT_FILE)) {
        console.warn(`[designs] download failed (${e.message}); reusing cached data`);
        return;
      }
      throw e;
    }
  }

  const readme = fs.readFileSync(path.join(repoDir, "README.md"), "utf8");
  const meta = parseReadme(readme);
  const categoryOrder = [...new Set(Object.values(meta).map((m) => m.category))];

  const base = path.join(repoDir, "design-md");
  const ids = fs.readdirSync(base).filter((d) => fs.existsSync(path.join(base, d, "DESIGN.md")));
  const designs = [];
  for (const id of ids.sort()) {
    const markdown = fs.readFileSync(path.join(base, id, "DESIGN.md"), "utf8").replace(/\r\n/g, "\n");
    const { tokens, body } = splitFrontmatter(markdown);
    const palette = tokens?.colors
      ? Object.entries(tokens.colors)
          .map(([name, value]) => ({ name, value: resolver(tokens)(value), group: "" }))
          .filter((p) => isColor(p.value))
      : prosePalette(body);
    const fonts = proseFonts(body);
    const secs = sections(body);
    const m = meta[id] || {};
    const firstPara = (secs[0]?.content || "")
      .split(/\n\n/)
      .find((p) => p && !p.startsWith("#") && !p.startsWith("-") && !p.startsWith("|"));
    designs.push({
      id,
      slug: id.replace(/\./g, "-"),
      name: m.name || titleCase(id),
      category: m.category || "Other",
      tagline: m.tagline || "",
      description:
        (typeof tokens?.description === "string" && tokens.description) ||
        Object.values(tokens || {}).find((v) => typeof v === "string" && v.length > 120) ||
        firstPara ||
        "",
      hasTokens: Boolean(tokens?.colors),
      markdown,
      body,
      sections: secs.map((s) => s.title),
      tokens: tokens
        ? {
            colors: tokens.colors || {},
            typography: tokens.typography || {},
            rounded: tokens.rounded || {},
            spacing: tokens.spacing || {},
            components: tokens.components || {},
          }
        : null,
      palette,
      theme: buildTheme({ tokens, palette, fonts, body }),
      githubUrl: `https://github.com/${REPO}/blob/${REF}/design-md/${id}/DESIGN.md`,
      rawUrl: `https://raw.githubusercontent.com/${REPO}/${REF}/design-md/${id}/DESIGN.md`,
    });
  }

  if (!categoryOrder.includes("Other") && designs.some((d) => d.category === "Other"))
    categoryOrder.push("Other");

  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ fetchedAt: new Date().toISOString(), repo: REPO, ref: REF, categories: categoryOrder, designs }),
  );
  console.log(
    `[designs] ${designs.length} designs (${designs.filter((d) => d.hasTokens).length} with tokens) → .designs/designs.json`,
  );
}

main().catch((e) => {
  console.error("[designs]", e);
  process.exit(1);
});

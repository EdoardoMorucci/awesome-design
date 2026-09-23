import "server-only";
import fs from "node:fs";
import path from "node:path";

export type TypeStyle = {
  size: string;
  weight: string;
  lineHeight: string;
  letterSpacing: string;
  transform: string;
};

export type Theme = {
  mode: "light" | "dark";
  canvas: string;
  surface: string;
  ink: string;
  body: string;
  muted: string;
  hairline: string;
  primary: string;
  onPrimary: string;
  secondaryBg: string;
  secondaryText: string;
  secondaryBorder: string;
  surfaceDark: string;
  onDark: string;
  footerBg: string;
  footerText: string;
  inputBg: string;
  inputText: string;
  inputBorder: string | null;
  accents: string[];
  fonts: { display: string; body: string; mono: string; google: string[] };
  type: Record<"display" | "h2" | "h3" | "body" | "eyebrow" | "button", TypeStyle>;
  radius: { button: string; card: string; input: string; pill: string };
  button: { padding: string; height: string };
  shadow: string;
};

export type Tokens = {
  colors: Record<string, unknown>;
  typography: Record<string, Record<string, unknown>>;
  rounded: Record<string, unknown>;
  spacing: Record<string, unknown>;
  components: Record<string, Record<string, unknown>>;
};

export type Design = {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  hasTokens: boolean;
  markdown: string;
  body: string;
  sections: string[];
  tokens: Tokens | null;
  palette: { name: string; value: string; group: string }[];
  theme: Theme;
  githubUrl: string;
  rawUrl: string;
};

export type DesignSummary = Pick<
  Design,
  "slug" | "name" | "category" | "tagline"
> & { primary: string; canvas: string; ink: string };

type Data = {
  fetchedAt: string;
  repo: string;
  ref: string;
  categories: string[];
  designs: Design[];
};

let cache: Data | null = null;

function load(): Data {
  if (cache) return cache;
  const file = path.join(process.cwd(), ".designs", "designs.json");
  if (!fs.existsSync(file)) {
    throw new Error("Missing .designs/designs.json — run `npm run designs` first.");
  }
  cache = JSON.parse(fs.readFileSync(file, "utf8")) as Data;
  return cache;
}

export function getDesigns(): Design[] {
  return load().designs;
}

export function getDesign(slug: string): Design | undefined {
  return load().designs.find((d) => d.slug === slug);
}

export function getMeta() {
  const { fetchedAt, repo, ref, categories } = load();
  return { fetchedAt, repo, ref, categories };
}

export function getSummaries(): DesignSummary[] {
  return load().designs.map((d) => ({
    slug: d.slug,
    name: d.name,
    category: d.category,
    tagline: d.tagline,
    primary: d.theme.primary,
    canvas: d.theme.canvas,
    ink: d.theme.ink,
  }));
}

/** Splits the markdown body into a preamble and its `## ` sections. */
export function splitSections(body: string) {
  const parts: { title: string; markdown: string }[] = [];
  let preamble = "";
  let cur: { title: string; markdown: string } | null = null;
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      cur = { title: h[1], markdown: line + "\n" };
      parts.push(cur);
    } else if (cur) {
      cur.markdown += line + "\n";
    } else {
      preamble += line + "\n";
    }
  }
  return { preamble: preamble.trim(), sections: parts };
}

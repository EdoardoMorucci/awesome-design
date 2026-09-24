import { Gallery } from "@/components/Gallery";
import { getDesigns, getMeta } from "@/lib/designs";
import s from "./browser.module.css";

export default function Home() {
  const designs = getDesigns();
  const { categories } = getMeta();
  const cards = designs.map((d) => ({
    slug: d.slug,
    name: d.name,
    category: d.category,
    tagline: d.tagline || d.description,
    hasTokens: d.hasTokens,
    theme: {
      canvas: d.theme.canvas,
      surface: d.theme.surface,
      ink: d.theme.ink,
      muted: d.theme.muted,
      primary: d.theme.primary,
      onPrimary: d.theme.onPrimary,
      hairline: d.theme.hairline,
      display: d.theme.fonts.display,
      displayWeight: d.theme.type.display.weight,
      buttonRadius: d.theme.radius.button,
      swatches: [
        ...new Set([
          d.theme.primary,
          ...d.theme.accents,
          d.theme.ink,
          d.theme.surfaceDark,
          d.theme.canvas,
          d.theme.surface,
        ]),
      ].slice(0, 6),
    },
  }));

  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={s.kicker}>The Book — every design system, before it ships</p>
        <h1>Design systems your AI agent can read.</h1>
        <p>
          {designs.length} DESIGN.md files extracted from real websites. Pick one, see it rendered as
          a live site, then copy the markdown, tokens or specs straight into your project.
        </p>
      </header>
      <Gallery cards={cards} categories={categories} />
    </div>
  );
}

// Families on Google Fonts that only ship a single 400 weight; requesting a
// weight axis for them makes the css2 endpoint fail.
const SINGLE_WEIGHT = new Set([
  "Anton", "Archivo Black", "Bebas Neue", "VT323", "Press Start 2P", "Silkscreen",
  "Ubuntu Mono", "Space Mono", "DM Serif Display", "Instrument Serif",
]);

export function googleFontsHref(families: string[]): string | null {
  if (!families.length) return null;
  const params = families.map((f) => {
    const name = f.replace(/ /g, "+");
    return SINGLE_WEIGHT.has(f) ? `family=${name}` : `family=${name}:wght@300;400;500;600;700`;
  });
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}

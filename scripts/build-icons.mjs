// Rasterises src/app/icon.svg into favicon.ico (16/32/48) and apple-icon.png (180).
// Run with `node scripts/build-icons.mjs` after editing the SVG.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const APP = new URL("../src/app/", import.meta.url);
const svg = await readFile(new URL("icon.svg", APP));

const png = (source, size) =>
  sharp(source, { density: (72 * size) / 32 * 4 }).resize(size, size).png().toBuffer();

// ICO container holding PNG-encoded images (supported by every current browser).
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(svg, s)));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(sizes[i], e);
  header.writeUInt8(sizes[i], e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
await writeFile(new URL("favicon.ico", APP), Buffer.concat([header, ...images]));

// iOS masks its own rounded corners, so the touch icon is a full-bleed square.
const square = Buffer.from(svg.toString().replace(/rx="7"/, 'rx="0"'));
await writeFile(new URL("apple-icon.png", APP), await png(square, 180));

console.log("Wrote favicon.ico and apple-icon.png");

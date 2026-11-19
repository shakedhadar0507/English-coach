// Generates PWA icons from an inline SVG. Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#7655D6"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
    <path d="M120 150h170a30 30 0 0 1 30 30v10H160v60h140v40H160v60h170v10a30 30 0 0 1-30 30H120z" fill="#fff"/>
    <path d="M330 250a90 90 0 1 1 0 0.1" fill="none"/>
    <circle cx="380" cy="160" r="34" fill="#FFD166"/>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });
const out = [
  ["public/icons/icon-192.png", 192, 0], ["public/icons/icon-512.png", 512, 0],
  ["public/icons/icon-maskable-512.png", 512, 70], ["public/icons/apple-touch-icon.png", 180, 30],
];
for (const [file, size, pad] of out) await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(file);
console.log("icons written");

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const logo = await readFile(resolve(root, "public/brand/final/windreed-logo-on-dark.svg"));
const background = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#10272e"/>
  <rect x="28" y="28" width="1144" height="574" fill="none" stroke="#a98f53" stroke-opacity=".32"/>
  <rect x="50" y="50" width="1100" height="530" fill="none" stroke="#76917f" stroke-opacity=".2"/>
  <circle cx="1005" cy="315" r="176" fill="none" stroke="#a98f53" stroke-opacity=".25"/>
  <circle cx="1005" cy="315" r="145" fill="none" stroke="#76917f" stroke-opacity=".22"/>
  <path d="M850 510c42-118 91-176 148-216M1160 510c-43-118-92-176-149-216" fill="none" stroke="#c5ad6d" stroke-opacity=".72" stroke-width="3"/>
  <text x="105" y="128" fill="#c5ad6d" font-family="Georgia,serif" font-size="17" letter-spacing="5">THE SWORD COAST · 1492 DR</text>
  <text x="102" y="255" fill="#f4efe4" font-family="Georgia,serif" font-size="76" letter-spacing="2">THE WINDREED</text>
  <text x="102" y="344" fill="#f4efe4" font-family="Georgia,serif" font-size="76" letter-spacing="2">WAYFARERS</text>
  <line x1="105" y1="393" x2="705" y2="393" stroke="#76917f" stroke-opacity=".45"/>
  <text x="105" y="450" fill="#d8d2c5" font-family="SimSun,Songti SC,serif" font-size="27" letter-spacing="4">风芦旅人 · 公开档案</text>
  <text x="105" y="505" fill="#93a59c" font-family="Georgia,serif" font-size="15" letter-spacing="4">LIVES · PLACES · RELICS · LORE · STORIES</text>
</svg>`);

await sharp(background)
  .composite([{ input: await sharp(logo).resize(198, 198).png().toBuffer(), left: 906, top: 216 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(root, "public/og.png"));

console.log("public/og.png generated from the existing Windreed logo.");

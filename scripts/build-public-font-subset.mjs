import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = resolve(import.meta.dirname, "..");
const sourceFontUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf";
const cachedSourceFont = join(tmpdir(), "windreed-NotoSerifSC-wght.ttf");
const textFile = join(tmpdir(), "windreed-public-font-characters.txt");
const outputFile = join(projectRoot, "public", "fonts", "windreed-noto-serif-sc.woff2");
const textExtensions = new Set([".css", ".md", ".ts", ".tsx"]);
const nonPublicAppDirectories = new Set(["api", "edit", "editor"]);

async function collectFiles(directory, isAppRoot = false) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (isAppRoot && entry.isDirectory() && nonPublicAppDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await collectFiles(path));
    else if (textExtensions.has(extname(entry.name))) output.push(path);
  }
  return output;
}

async function publicSourceFiles() {
  const archiveSource = await readFile(join(projectRoot, "app", "archive-content.server.ts"), "utf8");
  const imports = [...archiveSource.matchAll(/from\s+"\.\.\/content\/source\/([^"?]+)\?raw"/g)]
    .map((match) => join(projectRoot, "content", "source", match[1]));
  return [...new Set(imports)];
}

async function ensureSourceFont() {
  try {
    if ((await stat(cachedSourceFont)).size > 20_000_000) return;
  } catch {
    // Download below when the cache is absent or incomplete.
  }

  const windowsSystemFont = "C:\\Windows\\Fonts\\NotoSerifSC-VF.ttf";
  try {
    if ((await stat(windowsSystemFont)).size > 20_000_000) {
      await copyFile(windowsSystemFont, cachedSourceFont);
      return;
    }
  } catch {
    // Other systems fall back to the official Google Fonts source below.
  }

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(sourceFontUrl);
      if (!response.ok) throw new Error(`Unable to download Noto Serif SC: ${response.status}`);
      await writeFile(cachedSourceFont, Buffer.from(await response.arrayBuffer()));
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
    }
  }
  throw lastError;
}

const interfaceFiles = await collectFiles(join(projectRoot, "app"), true);
const archiveFiles = await publicSourceFiles();
const files = [...new Set([...interfaceFiles, ...archiveFiles])];
const characters = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789  \n\t，。！？；：、（）《》〈〉「」『』【】—…·“”‘’/+-=→↗⌕⌂›∅");

for (const file of files) {
  const value = await readFile(file, "utf8");
  for (const character of value.normalize("NFC")) {
    if (character >= " " || character === "\n" || character === "\t") characters.add(character);
  }
}

await ensureSourceFont();
await mkdir(dirname(outputFile), { recursive: true });
await writeFile(textFile, [...characters].join(""), "utf8");
await execFileAsync("python", [
  "-m",
  "fontTools.subset",
  cachedSourceFont,
  `--text-file=${textFile}`,
  `--output-file=${outputFile}`,
  "--flavor=woff2",
  "--layout-features=*",
  "--no-hinting",
  "--drop-tables+=DSIG",
]);

const outputSize = (await stat(outputFile)).size;
console.log(`${basename(outputFile)}: ${characters.size} characters, ${(outputSize / 1024).toFixed(1)} KiB`);

import { createHash } from "node:crypto";
import { link, mkdir, readdir, readFile, rename, stat, unlink } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import { loadLocalArchive } from "./lib/local-archive.mjs";

const root = process.cwd();
const sourceRoot = resolve(root, "content", "source");
const vaultRoot = resolve(root, "..");
const applyLinks = process.argv.includes("--link");
const localArchive = await loadLocalArchive();
const errors = [];
const missingLinks = [];
const detachedCopies = [];
const legacyPublicTerms = [
  /养病的城/u,
  /绝冬城/u,
  /绝冬林/u,
  /绝冬河/u,
  /德萨林河谷/u,
  /亡者之沼/u,
  /艾佛瑞斯卡/u,
  /远古誓言/u,
  /远古之誓/u,
  /上古之誓/u,
  /Redlarch/u,
  /沃恩拉/u,
  /阴影谷/u,
  /阿拉贝(?!尔)/u,
  /伊里亚博/u,
  /贝尔杜斯克/u,
  /斯科努贝尔/u,
  /芦溪村/u,
];

function normalized(value) {
  return value.normalize("NFC").toLocaleLowerCase("zh-CN");
}

function pathInside(parent, candidate) {
  return candidate === parent || candidate.startsWith(`${parent}${sep}`);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function digest(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function markdownFiles(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && extname(entry.name).toLowerCase() === ".md" ? [path] : [];
  }));
  return nested.flat();
}

if (localArchive.sections.length !== 9) {
  errors.push(`网站索引应有 9 卷，当前为 ${localArchive.sections.length} 卷。`);
}

const sectionIds = new Set();
const sectionDirectories = new Set();
for (const section of localArchive.sections) {
  const collection = localArchive.collections[section.collection];
  const directory = collection ? `${collection.directory}/${section.directory}` : "";
  if (sectionIds.has(section.id)) errors.push(`重复的 section：${section.id}`);
  if (sectionDirectories.has(normalized(directory))) errors.push(`重复的九卷目录：${directory}`);
  if (!collection) errors.push(`${section.id} 引用了未知目录组：${section.collection}`);
  sectionIds.add(section.id);
  sectionDirectories.add(normalized(directory));
  if (directory && !await exists(resolve(sourceRoot, directory))) {
    errors.push(`缺少九卷目录：content/source/${directory}`);
  }
}

const slugs = new Set();
const sourcePaths = new Set();
const sourceBySlug = new Map();
for (const source of localArchive.sources) {
  if (sourceBySlug.has(source.slug)) errors.push(`多个源文件使用同一 slug：${source.slug}`);
  sourceBySlug.set(source.slug, source);
}

for (const entry of localArchive.manifest) {
  const section = localArchive.sections.find((candidate) => candidate.id === entry.section);
  const collection = section ? localArchive.collections[section.collection] : null;
  const expectedDirectory = section && collection
    ? `${collection.directory}/${section.directory}/`
    : "";

  if (slugs.has(entry.slug)) errors.push(`重复 slug：${entry.slug}`);
  slugs.add(entry.slug);

  const source = sourceBySlug.get(entry.slug);
  if (!source) {
    errors.push(`${entry.slug} 没有登记源文件。`);
    continue;
  }
  const sourcePath = source.sourcePath.replaceAll("\\", "/").normalize("NFC");
  const absoluteSource = resolve(sourceRoot, sourcePath);

  if (sourcePaths.has(normalized(sourcePath))) errors.push(`多个词条共用源文件：${sourcePath}`);
  sourcePaths.add(normalized(sourcePath));

  if (!expectedDirectory || !sourcePath.startsWith(expectedDirectory)) {
    errors.push(`${entry.slug} 应位于 ${expectedDirectory || "有效九卷目录"}，当前为 ${sourcePath}`);
  }
  if (!pathInside(sourceRoot, absoluteSource)) errors.push(`${entry.slug} 的 sourcePath 越出 content/source。`);
  if (!await exists(absoluteSource)) errors.push(`${entry.slug} 缺少源文件：${sourcePath}`);
  if (await exists(absoluteSource)) {
    const markdown = await readFile(absoluteSource, "utf8");
    const body = markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "");
    const legacy = legacyPublicTerms.find((pattern) => pattern.test(body));
    if (legacy) errors.push(`${entry.slug} 的公开正文仍含旧用名：${legacy.source}`);
  }
  if (basename(sourcePath, extname(sourcePath)).normalize("NFC").startsWith(entry.title.normalize("NFC")) === false) {
    errors.push(`${entry.slug} 的文件名应以公开中文标题“${entry.title}”开头：${sourcePath}`);
  }
  if (/[<>:"|?*\u0000-\u001f]/.test(sourcePath) || /[. ](?:\/|$)/.test(sourcePath)) {
    errors.push(`${entry.slug} 的路径含 Windows 不兼容字符：${sourcePath}`);
  }
  if (sourcePath.length > 220) errors.push(`${entry.slug} 的相对路径过长：${sourcePath.length} 字符。`);
}

for (const source of localArchive.sources) {
  if (!slugs.has(source.slug)) errors.push(`源文件没有对应公开词条：${source.slug}`);
}

const catalogDirectories = localArchive.sections.map((section) => {
  const collection = localArchive.collections[section.collection];
  return resolve(sourceRoot, collection.directory, section.directory);
});
const catalogFiles = (await Promise.all(catalogDirectories.map(markdownFiles))).flat();
for (const file of catalogFiles) {
  const sourcePath = relative(sourceRoot, file).replaceAll("\\", "/").normalize("NFC");
  if (!sourcePaths.has(normalized(sourcePath))) errors.push(`九卷源树中存在未登记 Markdown：${sourcePath}`);
}

const hasVault = await exists(resolve(vaultRoot, ".obsidian"));
if (hasVault) {
  for (const sourcePath of ["风芦旅人.md", ...localArchive.sources.map((source) => source.sourcePath)]) {
    const source = resolve(sourceRoot, sourcePath);
    const mirror = resolve(vaultRoot, sourcePath);
    if (!pathInside(vaultRoot, mirror)) {
      errors.push(`Obsidian 映射越出仓库：${sourcePath}`);
      continue;
    }
    if (!await exists(mirror)) {
      missingLinks.push({ sourcePath, source, mirror });
      continue;
    }
    const [sourceStat, mirrorStat] = await Promise.all([stat(source), stat(mirror)]);
    const sameLink = sourceStat.dev === mirrorStat.dev && sourceStat.ino === mirrorStat.ino;
    if (!sameLink) {
      const sameContent = await digest(source) === await digest(mirror);
      if (sameContent) detachedCopies.push({ sourcePath, source, mirror });
      else errors.push(`${sourcePath} 在 Obsidian 根目录是冲突副本，未自动处理。`);
    }
  }
}

if (applyLinks && !errors.length) {
  for (const item of detachedCopies) {
    const temporaryLink = `${item.mirror}.windreed-link-${process.pid}`;
    const backup = `${item.mirror}.windreed-backup-${process.pid}`;
    await link(item.source, temporaryLink);
    await rename(item.mirror, backup);
    try {
      await rename(temporaryLink, item.mirror);
      await unlink(backup);
    } catch (error) {
      if (await exists(temporaryLink)) await unlink(temporaryLink);
      if (!await exists(item.mirror) && await exists(backup)) await rename(backup, item.mirror);
      throw error;
    }
    console.log(`已合并重复正文：${item.sourcePath}`);
  }
  detachedCopies.length = 0;
  for (const item of missingLinks) {
    await mkdir(dirname(item.mirror), { recursive: true });
    await link(item.source, item.mirror);
    console.log(`已建立 Obsidian 映射：${item.sourcePath}`);
  }
  missingLinks.length = 0;
}

if (detachedCopies.length) {
  errors.push(
    `发现 ${detachedCopies.length} 个内容相同但彼此独立的 Obsidian 副本；运行 npm run content:link-vault 可安全合并。`,
  );
  for (const item of detachedCopies) errors.push(`独立副本：${item.sourcePath}`);
}

if (missingLinks.length) {
  errors.push(
    `缺少 ${missingLinks.length} 个 Obsidian 硬链接；确认后运行 npm run content:link-vault。`,
  );
  for (const item of missingLinks) errors.push(`缺少本地映射：${item.sourcePath}`);
}

if (errors.length) {
  console.error("内容目录检查未通过：");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`内容目录检查通过：9 卷，${localArchive.manifest.length} 个公开词条，${sourcePaths.size} 个独立源文件。`);
  if (hasVault) console.log("Obsidian 与网站源树使用同一批硬链接正文。");
}

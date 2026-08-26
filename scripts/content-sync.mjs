import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve, sep } from "node:path";
import { loadLocalArchive } from "./lib/local-archive.mjs";
import {
  classifySync,
  createLocalPackage,
  updateCommonBase,
  validateOnlinePackage,
} from "./lib/content-sync-core.mjs";

const root = process.cwd();
const syncDir = resolve(root, ".windreed-sync");
const latestPath = resolve(syncDir, "online-latest.json");
const basePath = resolve(syncDir, "base.json");
const outboxPath = resolve(syncDir, "outbox.json");
const incomingDir = resolve(root, "content", "incoming");
const command = process.argv[2] ?? "status";

async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function statusLabel(status) {
  return {
    "in-sync": "已同步",
    "local-changed": "本地有修改",
    "online-changed": "线上有修改",
    conflict: "发生冲突",
    "local-only": "仅本地存在",
    "online-only": "仅线上存在",
  }[status] ?? status;
}

function printSummary(classification) {
  const totals = new Map();
  for (const item of classification) totals.set(item.status, (totals.get(item.status) ?? 0) + 1);
  for (const status of ["in-sync", "local-changed", "online-changed", "conflict", "local-only", "online-only"]) {
    if (totals.get(status)) console.log(`${statusLabel(status)}：${totals.get(status)}`);
  }
  const attention = classification.filter((item) => item.status !== "in-sync");
  if (attention.length) {
    console.log("\n需要处理：");
    for (const item of attention) console.log(`- ${item.slug} · ${statusLabel(item.status)}`);
  }
}

function safeFileStem(payload) {
  const label = [payload.title, payload.englishTitle].filter(Boolean).join(" ").normalize("NFC");
  const cleaned = label
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/[. ]+$/g, "")
    .trim();
  return (cleaned || payload.slug).slice(0, 160);
}

function incomingTarget(item, localArchive) {
  const payload = item.onlineEntry.payload;
  const manifestEntry = localArchive.manifest.find((entry) => entry.slug === payload.slug);
  const sourceEntry = localArchive.sources.find((entry) => entry.slug === payload.slug);
  const section = localArchive.sections.find((candidate) => candidate.id === payload.section);
  if (!section) throw new Error(`${payload.slug} 使用了未知卷册：${payload.section}`);
  const collection = localArchive.collections[section.collection];
  if (!collection) throw new Error(`${payload.slug} 使用了未知目录组：${section.collection}`);
  if (manifestEntry && !sourceEntry) {
    throw new Error(`${payload.slug} 已登记为公开词条，但缺少本地源文件映射。`);
  }
  const sourceFile = sourceEntry
    ? basename(sourceEntry.sourcePath)
    : `${safeFileStem(payload)} [${payload.slug}].md`;
  const stem = sourceFile.slice(0, sourceFile.length - extname(sourceFile).length);
  const directory = resolve(incomingDir, collection.directory, section.directory);
  const markdownPath = resolve(directory, `${stem}.md`);
  const jsonPath = resolve(directory, `${stem}.json`);
  const incomingPrefix = `${incomingDir}${sep}`;
  if (!markdownPath.startsWith(incomingPrefix) || !jsonPath.startsWith(incomingPrefix)) {
    throw new Error(`${payload.slug} 的待合并路径超出 content/incoming。`);
  }
  return {
    markdownPath,
    jsonPath,
    sourcePath: `${collection.directory}/${section.directory}/${sourceFile}`,
  };
}

function incomingMarkdown(item, sourcePath) {
  const payload = item.onlineEntry.payload;
  const header = [
    "---",
    `windreed_sync_status: ${item.status}`,
    `slug: ${payload.slug}`,
    `online_revision: ${item.onlineEntry.baseRevision}`,
    `category: ${payload.category}`,
    `section: ${payload.section}`,
    `title: ${JSON.stringify(payload.title)}`,
    `source_path: ${JSON.stringify(sourcePath)}`,
    "---",
    "",
  ].join("\n");
  return `${header}${item.onlineEntry.markdown ?? ""}\n`;
}

async function context() {
  const [localArchive, onlinePackage, baseState] = await Promise.all([
    loadLocalArchive(),
    readJson(latestPath),
    readJson(basePath, { entries: {} }),
  ]);
  if (!onlinePackage) {
    throw new Error("尚未拉取线上同步包。请先在修史室导出，再运行 npm run content:pull -- <文件路径>。");
  }
  validateOnlinePackage(onlinePackage);
  const localEntries = localArchive.entries;
  return {
    localEntries,
    onlinePackage,
    baseState,
    classification: classifySync(localEntries, onlinePackage, baseState),
  };
}

if (command === "pull") {
  const input = process.argv[3];
  if (!input) throw new Error("请提供从修史室下载的同步包路径。");
  const onlinePackage = validateOnlinePackage(JSON.parse(await readFile(resolve(root, input), "utf8")));
  await writeJson(latestPath, onlinePackage);
  const localArchive = await loadLocalArchive();
  const localEntries = localArchive.entries;
  const baseState = await readJson(basePath, { entries: {} });
  const classification = classifySync(localEntries, onlinePackage, baseState);
  await writeJson(basePath, updateCommonBase(baseState, classification));
  await mkdir(incomingDir, { recursive: true });
  for (const item of classification) {
    if (!item.onlineEntry || !["online-changed", "online-only", "conflict"].includes(item.status)) continue;
    const target = incomingTarget(item, localArchive);
    const markdown = incomingMarkdown({
      ...item,
      onlineEntry: {
        ...item.onlineEntry,
        markdown: localArchive.toMarkdown(item.onlineEntry.payload.body),
      },
    }, target.sourcePath);
    await mkdir(dirname(target.markdownPath), { recursive: true });
    await writeFile(target.markdownPath, markdown, "utf8");
    await writeJson(target.jsonPath, {
      syncStatus: item.status,
      onlineRevision: item.onlineEntry.baseRevision,
      sourcePath: target.sourcePath,
      payload: item.onlineEntry.payload,
    });
  }
  console.log(`已拉取：${basename(input)}`);
  printSummary(classification);
  if (classification.some((item) => ["online-changed", "online-only", "conflict"].includes(item.status))) {
    console.log(`\n线上内容已写入待合并目录：${incomingDir}`);
  }
} else if (command === "push") {
  const { classification } = await context();
  const { syncPackage, blocked } = createLocalPackage(classification);
  await writeJson(outboxPath, syncPackage);
  console.log(`已生成本地推送包：${outboxPath}`);
  console.log(`待推送草稿：${syncPackage.entries.length}`);
  if (blocked.length) console.log(`因线上变化或冲突而暂停：${blocked.join("、")}`);
} else if (command === "status") {
  const { baseState, classification } = await context();
  await writeJson(basePath, updateCommonBase(baseState, classification));
  printSummary(classification);
} else {
  throw new Error(`未知同步命令：${command}`);
}

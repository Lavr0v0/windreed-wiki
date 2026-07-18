import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
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

function incomingMarkdown(item) {
  const payload = item.onlineEntry.payload;
  const header = [
    "---",
    `windreed_sync_status: ${item.status}`,
    `slug: ${payload.slug}`,
    `online_revision: ${item.onlineEntry.baseRevision}`,
    `category: ${payload.category}`,
    `section: ${payload.section}`,
    `title: ${JSON.stringify(payload.title)}`,
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
    const markdown = incomingMarkdown({
      ...item,
      onlineEntry: {
        ...item.onlineEntry,
        markdown: localArchive.toMarkdown(item.onlineEntry.payload.body),
      },
    });
    await writeFile(resolve(incomingDir, `${item.slug}.md`), markdown, "utf8");
    await writeJson(resolve(incomingDir, `${item.slug}.json`), {
      syncStatus: item.status,
      onlineRevision: item.onlineEntry.baseRevision,
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

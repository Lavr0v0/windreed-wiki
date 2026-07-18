import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadLocalArchive } from "./lib/local-archive.mjs";
import { CONTENT_SYNC_FORMAT } from "./lib/sync-format.mjs";

const root = process.cwd();
const database = process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim();
const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID?.trim();
const editorEmail = process.env.WINDREED_ADMIN_EMAILS?.split(",")[0]?.trim().toLowerCase();
const confirmed = process.argv.includes("--confirm");

if (!confirmed) throw new Error("此命令会公开线上草稿。确认后请附加 --confirm。");
if (!database || !namespaceId || !editorEmail) {
  throw new Error(".env.cloudflare 缺少数据库、缓存命名空间或管理员邮箱。");
}

const wrangler = resolve(root, "node_modules", "wrangler", "bin", "wrangler.js");
const outboxPath = resolve(root, ".windreed-sync", "outbox.json");
const sqlPath = resolve(root, ".windreed-sync", "publish-drafts.sql");

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runWrangler(args, options = {}) {
  return execFileSync(process.execPath, [wrangler, ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    stdio: options.stdio ?? ["ignore", "pipe", "inherit"],
  });
}

function queryOnline(command) {
  const output = runWrangler([
    "d1",
    "execute",
    database,
    "--remote",
    "--json",
    "--command",
    command,
  ]);
  return JSON.parse(output).flatMap((batch) => batch.results ?? []);
}

const syncPackage = JSON.parse(await readFile(outboxPath, "utf8"));
if (
  syncPackage.format !== CONTENT_SYNC_FORMAT
  || syncPackage.version !== 1
  || syncPackage.source !== "local"
  || !Array.isArray(syncPackage.entries)
) {
  throw new Error("outbox.json 不是受支持的本地推送包。");
}
if (!syncPackage.entries.length) throw new Error("推送包中没有等待发布的本地词条。");

const localArchive = await loadLocalArchive();
const localBySlug = new Map(localArchive.entries.map((entry) => [entry.payload.slug, entry.payload]));
for (const entry of syncPackage.entries) {
  const local = localBySlug.get(entry?.payload?.slug);
  if (!local || JSON.stringify(local) !== JSON.stringify(entry.payload)) {
    throw new Error(`${entry?.payload?.slug ?? "未知词条"} 与当前本地公开内容不一致，请重新生成推送包。`);
  }
}

const slugs = syncPackage.entries.map((entry) => entry.payload.slug);
const slugSql = slugs.map(sql).join(", ");
const beforeRows = queryOnline(`
  SELECT e.id, e.slug, e.current_revision, e.published_revision, r.payload
  FROM entries e
  JOIN entry_revisions r
    ON r.entry_id = e.id
   AND r.revision = e.current_revision
  WHERE e.slug IN (${slugSql});
`);
const beforeBySlug = new Map(beforeRows.map((row) => [row.slug, row]));

for (const entry of syncPackage.entries) {
  const online = beforeBySlug.get(entry.payload.slug);
  if (!online) throw new Error(`线上没有找到待发布词条：${entry.payload.slug}`);
  if (online.payload !== JSON.stringify(entry.payload)) {
    throw new Error(`${entry.payload.slug} 的线上草稿已变化，请重新拉取并核对。`);
  }
}

const now = Date.now();
const statements = beforeRows.map((row) => `
  UPDATE entries
  SET status = 'published', published_revision = current_revision,
      published_at = ${now}, updated_by = ${sql(editorEmail)}, updated_at = ${now}
  WHERE id = ${sql(row.id)} AND current_revision = ${Number(row.current_revision)};
`);
await mkdir(dirname(sqlPath), { recursive: true });
await writeFile(sqlPath, `${statements.join("\n")}\n`, "utf8");
runWrangler([
  "d1",
  "execute",
  database,
  "--remote",
  "--yes",
  "--file",
  sqlPath,
], { stdio: "inherit" });

const afterRows = queryOnline(`
  SELECT slug, status, current_revision, published_revision
  FROM entries WHERE slug IN (${slugSql});
`);
const failed = afterRows.filter((row) => (
  row.status !== "published"
  || Number(row.published_revision) !== Number(row.current_revision)
));
if (afterRows.length !== slugs.length || failed.length) {
  throw new Error(`线上发布后校验失败：${failed.map((row) => row.slug).join("、") || "词条数量不一致"}`);
}

const listed = runWrangler([
  "kv",
  "key",
  "list",
  "--namespace-id",
  namespaceId,
  "--remote",
  "--prefix",
  "public-archive:v1:",
]);
const cacheKeys = JSON.parse(listed).map((item) => item.name).filter(Boolean);
for (const key of cacheKeys) {
  runWrangler([
    "kv",
    "key",
    "delete",
    key,
    "--namespace-id",
    namespaceId,
    "--remote",
  ], { stdio: "ignore" });
}

console.log(`已发布线上词条：${slugs.length}`);
console.log(`已清除公开缓存：${cacheKeys.length}`);

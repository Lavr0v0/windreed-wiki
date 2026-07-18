import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadLocalArchive } from "./lib/local-archive.mjs";

const root = process.cwd();
const database = process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim();
const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID?.trim();
const editorEmail = process.env.WINDREED_ADMIN_EMAILS?.split(",")[0]?.trim().toLowerCase();

if (!process.argv.includes("--confirm")) {
  throw new Error("此命令会按网站目录修正线上分类。确认后请附加 --confirm。");
}
if (!database || !namespaceId || !editorEmail) {
  throw new Error(".env.cloudflare 缺少数据库、缓存命名空间或管理员邮箱。");
}

const wrangler = resolve(root, "node_modules", "wrangler", "bin", "wrangler.js");
const sqlPath = resolve(root, ".windreed-sync", "normalize-classification.sql");

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

const localArchive = await loadLocalArchive();
const canonicalBySlug = new Map(localArchive.entries.map(({ payload }) => [payload.slug, payload]));
const rows = queryOnline(`
  SELECT e.id, e.slug, e.status, e.category, e.section,
         e.current_revision, e.published_revision, r.payload, r.plain_text
  FROM entries e
  JOIN entry_revisions r
    ON r.entry_id = e.id AND r.revision = e.current_revision
  ORDER BY e.slug;
`);

const mismatches = rows.flatMap((row) => {
  const canonical = canonicalBySlug.get(String(row.slug));
  if (!canonical) return [];
  if (row.category === canonical.category && row.section === canonical.section) return [];
  return [{ row, canonical }];
});

if (!mismatches.length) {
  console.log("线上文章分类已经与网站目录一致。");
  process.exit(0);
}

const now = Date.now();
const statements = mismatches.flatMap(({ row, canonical }) => {
  const nextRevision = Number(row.current_revision) + 1;
  const hasUnpublishedDraft = Number(row.current_revision) !== Number(row.published_revision);
  const payload = JSON.parse(String(row.payload));
  payload.category = canonical.category;
  payload.section = canonical.section;
  const revisionId = `revision_classification_${randomUUID()}`;
  return [
    `INSERT INTO entry_revisions (id, entry_id, revision, payload, plain_text, note, created_by, created_at) VALUES (${[
      revisionId,
      row.id,
      nextRevision,
      JSON.stringify(payload),
      row.plain_text,
      "按网站目录修正归档分类",
      editorEmail,
      now,
    ].map(sql).join(", ")});`,
    hasUnpublishedDraft
      ? `UPDATE entries SET category = ${sql(canonical.category)}, section = ${sql(canonical.section)}, current_revision = ${nextRevision}, updated_by = ${sql(editorEmail)}, updated_at = ${now} WHERE id = ${sql(row.id)} AND current_revision = ${Number(row.current_revision)};`
      : `UPDATE entries SET category = ${sql(canonical.category)}, section = ${sql(canonical.section)}, current_revision = ${nextRevision}, published_revision = ${nextRevision}, status = 'published', updated_by = ${sql(editorEmail)}, updated_at = ${now}, published_at = ${now} WHERE id = ${sql(row.id)} AND current_revision = ${Number(row.current_revision)};`,
  ];
});

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

const correctedRows = queryOnline(`
  SELECT e.slug, e.category, e.section, e.current_revision, e.published_revision,
         json_extract(r.payload, '$.category') AS payload_category,
         json_extract(r.payload, '$.section') AS payload_section
  FROM entries e
  JOIN entry_revisions r ON r.entry_id = e.id AND r.revision = e.current_revision
  WHERE e.slug IN (${mismatches.map(({ row }) => sql(row.slug)).join(", ")});
`);
const failed = correctedRows.filter((row) => {
  const canonical = canonicalBySlug.get(String(row.slug));
  return !canonical
    || row.category !== canonical.category
    || row.section !== canonical.section
    || row.payload_category !== canonical.category
    || row.payload_section !== canonical.section;
});
if (failed.length || correctedRows.length !== mismatches.length) {
  throw new Error(`线上分类校验失败：${failed.map((row) => row.slug).join("、") || "词条数量不一致"}`);
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

console.log(`已按网站目录修正：${mismatches.map(({ row }) => row.slug).join("、")}`);
console.log("已有未发布草稿仍保持未发布状态。");
console.log(`已清除公开缓存：${cacheKeys.length}`);

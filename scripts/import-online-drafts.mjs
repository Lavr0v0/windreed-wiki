import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadLocalArchive } from "./lib/local-archive.mjs";
import { CONTENT_SYNC_FORMAT } from "./lib/sync-format.mjs";

const root = process.cwd();
const database = process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim();
const editorEmail = process.env.WINDREED_ADMIN_EMAILS?.split(",")[0]?.trim().toLowerCase();
if (!process.argv.includes("--confirm")) {
  throw new Error("此命令会写入线上草稿。确认后请附加 --confirm。");
}
if (!database || !editorEmail) {
  throw new Error(".env.cloudflare 缺少数据库名称或管理员邮箱。");
}

const wrangler = resolve(root, "node_modules", "wrangler", "bin", "wrangler.js");
const outboxPath = resolve(root, ".windreed-sync", "outbox.json");
const sqlPath = resolve(root, ".windreed-sync", "import-drafts.sql");

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function queryOnline(command) {
  const output = execFileSync(process.execPath, [
    wrangler,
    "d1",
    "execute",
    database,
    "--remote",
    "--json",
    "--command",
    command,
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  });
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

const localArchive = await loadLocalArchive();
const localBySlug = new Map(localArchive.entries.map((entry) => [entry.payload.slug, entry.payload]));
for (const entry of syncPackage.entries) {
  const local = localBySlug.get(entry?.payload?.slug);
  if (!local || JSON.stringify(local) !== JSON.stringify(entry.payload)) {
    throw new Error(`${entry?.payload?.slug ?? "未知词条"} 与当前本地公开内容不一致，请重新生成推送包。`);
  }
}

const beforeRows = queryOnline(`
  SELECT e.id, e.slug, e.current_revision, r.payload
  FROM entries e
  JOIN entry_revisions r
    ON r.entry_id = e.id
   AND r.revision = e.current_revision;
`);
const beforeBySlug = new Map(beforeRows.map((row) => [row.slug, row]));
const now = Date.now();
const statements = [];
const expected = [];
const unchanged = [];
const conflicts = [];

for (const [index, candidate] of syncPackage.entries.entries()) {
  const payload = candidate.payload;
  const online = beforeBySlug.get(payload.slug);
  if (!online) {
    if (candidate.baseRevision !== null) {
      conflicts.push(payload.slug);
      continue;
    }
    const entryId = `entry_sync_${now}_${index}`;
    const revisionId = `revision_sync_${now}_${index}_1`;
    statements.push(
      `INSERT INTO entries (id, slug, category, section, status, current_revision, published_revision, created_by, updated_by, created_at, updated_at, published_at) SELECT ${[
        entryId,
        payload.slug,
        payload.category,
        payload.section,
        "draft",
        1,
        null,
        editorEmail,
        editorEmail,
        now,
        now,
        null,
      ].map(sql).join(", ")} WHERE NOT EXISTS (SELECT 1 FROM entries WHERE slug = ${sql(payload.slug)});`,
      `INSERT INTO entry_revisions (id, entry_id, revision, payload, plain_text, note, created_by, created_at) SELECT ${[
        revisionId,
        entryId,
        1,
        JSON.stringify(payload),
        localArchive.toPlainText(payload.body),
        "从本地内容同步包推送",
        editorEmail,
        now,
      ].map(sql).join(", ")} WHERE EXISTS (SELECT 1 FROM entries WHERE id = ${sql(entryId)} AND current_revision = 1);`,
    );
    expected.push({ slug: payload.slug, revision: 1, payload });
    continue;
  }

  if (Number(candidate.baseRevision) !== Number(online.current_revision)) {
    conflicts.push(payload.slug);
    continue;
  }
  if (JSON.stringify(payload) === online.payload) {
    unchanged.push(payload.slug);
    continue;
  }

  const nextRevision = Number(online.current_revision) + 1;
  const revisionId = `revision_sync_${now}_${index}_${nextRevision}`;
  statements.push(
    `INSERT INTO entry_revisions (id, entry_id, revision, payload, plain_text, note, created_by, created_at) SELECT ${[
      revisionId,
      online.id,
      nextRevision,
      JSON.stringify(payload),
      localArchive.toPlainText(payload.body),
      "从本地内容同步包推送",
      editorEmail,
      now,
    ].map(sql).join(", ")} WHERE EXISTS (SELECT 1 FROM entries WHERE id = ${sql(online.id)} AND current_revision = ${sql(online.current_revision)});`,
    `UPDATE entries SET slug = ${sql(payload.slug)}, category = ${sql(payload.category)}, section = ${sql(payload.section)}, current_revision = ${nextRevision}, updated_by = ${sql(editorEmail)}, updated_at = ${now} WHERE id = ${sql(online.id)} AND current_revision = ${sql(online.current_revision)} AND EXISTS (SELECT 1 FROM entry_revisions WHERE id = ${sql(revisionId)});`,
  );
  expected.push({ slug: payload.slug, revision: nextRevision, payload });
}

if (conflicts.length) {
  throw new Error(`线上版本发生变化，未写入：${conflicts.join("、")}`);
}
if (statements.length) {
  await writeFile(sqlPath, `${statements.join("\n")}\n`, "utf8");
  execFileSync(process.execPath, [
    wrangler,
    "d1",
    "execute",
    database,
    "--remote",
    "--yes",
    "--file",
    sqlPath,
  ], { cwd: root, stdio: "inherit" });
}

const afterRows = queryOnline(`
  SELECT e.slug, e.current_revision, r.payload
  FROM entries e
  JOIN entry_revisions r
    ON r.entry_id = e.id
   AND r.revision = e.current_revision;
`);
const afterBySlug = new Map(afterRows.map((row) => [row.slug, row]));
const failed = expected.filter((item) => {
  const online = afterBySlug.get(item.slug);
  return !online
    || Number(online.current_revision) !== item.revision
    || online.payload !== JSON.stringify(item.payload);
});
if (failed.length) {
  throw new Error(`线上写入后校验失败：${failed.map((item) => item.slug).join("、")}`);
}

console.log(`已导入线上草稿：${expected.length}`);
console.log(`无需更新：${unchanged.length}`);
console.log("公开版本未改变；请在修史室检查后再发布。");

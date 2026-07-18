import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadLocalArchive } from "./lib/local-archive.mjs";

const root = process.cwd();
const outputPath = resolve(root, ".wrangler", "windreed-editor-seed.sql");
const adminEmail = (process.env.WINDREED_ADMIN_EMAILS ?? "tiphereth.lucis@gmail.com")
  .split(",")[0]
  .trim()
  .toLowerCase();

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

const { entries, toPlainText } = await loadLocalArchive();
{
  const now = Date.now();
  const statements = ["PRAGMA foreign_keys = ON;"];

  for (const { payload } of entries) {
    const entryId = `entry_seed_${payload.slug}`;
    const revisionId = `revision_seed_${payload.slug}_1`;
    const payloadJson = JSON.stringify(payload);
    const plainText = toPlainText(payload.body);

    statements.push(
      `INSERT OR IGNORE INTO entries (id, slug, category, section, status, current_revision, published_revision, created_by, updated_by, created_at, updated_at, published_at) VALUES (${[
        entryId,
        payload.slug,
        payload.category,
        payload.section,
        "published",
        1,
        1,
        adminEmail,
        adminEmail,
        now,
        now,
        now,
      ].map(sql).join(", ")});`,
      `INSERT OR IGNORE INTO entry_revisions (id, entry_id, revision, payload, plain_text, note, created_by, created_at) VALUES (${[
        revisionId,
        entryId,
        1,
        payloadJson,
        plainText,
        "建立词条并迁移公开版本",
        adminEmail,
        now,
      ].map(sql).join(", ")});`,
    );
  }

  await mkdir(resolve(root, ".wrangler"), { recursive: true });
  await writeFile(outputPath, `${statements.join("\n")}\n`, "utf8");
  console.log(`已生成首次档案导入文件：${outputPath}`);
  console.log(`公开词条：${entries.length}`);
}

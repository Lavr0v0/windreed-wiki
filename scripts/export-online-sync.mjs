import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CONTENT_SYNC_FORMAT } from "./lib/sync-format.mjs";

const root = process.cwd();
const database = process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim();
if (!database) throw new Error(".env.cloudflare 缺少 CLOUDFLARE_D1_DATABASE_NAME。");

const wrangler = resolve(root, "node_modules", "wrangler", "bin", "wrangler.js");
const query = `
SELECT e.slug, e.current_revision, r.payload
FROM entries e
JOIN entry_revisions r
  ON r.entry_id = e.id
 AND r.revision = e.current_revision
ORDER BY e.slug;
`;

const stdout = execFileSync(process.execPath, [
  wrangler,
  "d1",
  "execute",
  database,
  "--remote",
  "--json",
  "--command",
  query,
], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
  stdio: ["ignore", "pipe", "inherit"],
});

const batches = JSON.parse(stdout);
const rows = batches.flatMap((batch) => batch.results ?? []);
const syncPackage = {
  format: CONTENT_SYNC_FORMAT,
  version: 1,
  generatedAt: new Date().toISOString(),
  source: "online",
  entries: rows.map((row) => ({
    baseRevision: Number(row.current_revision),
    payload: JSON.parse(row.payload),
  })),
};

const outputDir = resolve(root, ".windreed-sync");
const outputPath = resolve(outputDir, "online-d1.json");
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(syncPackage, null, 2)}\n`, "utf8");
console.log(`已导出线上同步包：${outputPath}`);
console.log(`线上词条：${syncPackage.entries.length}`);

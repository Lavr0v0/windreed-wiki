import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const envPath = resolve(root, ".env.cloudflare");
const sqlPath = resolve(root, ".wrangler", "production-switch.sql");

function emailList(value) {
  const emails = String(value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  for (const email of emails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`邮箱格式不正确：${email}`);
  }
  return Array.from(new Set(emails));
}

function slugList(value) {
  const slugs = String(value ?? "")
    .split(",")
    .map((slug) => slug.trim().toLowerCase())
    .filter(Boolean);
  for (const slug of slugs) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`URL 路径格式不正确：${slug}`);
  }
  return Array.from(new Set(slugs));
}

function envValue(source, name) {
  const match = new RegExp(`^${name}=(.*)$`, "m").exec(source);
  return match?.[1]?.trim() ?? "";
}

function setEnvValue(source, name, value) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`;
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

let envSource = await readFile(envPath, "utf8");
const existingAdmins = emailList(envValue(envSource, "WINDREED_ADMIN_EMAILS"));
const admins = Array.from(new Set([
  ...existingAdmins,
  ...emailList(process.env.WINDREED_ADDITIONAL_ADMINS),
]));
const editors = emailList(process.env.WINDREED_EDITOR_EMAILS)
  .filter((email) => !admins.includes(email));
const excludedSlugs = slugList(process.env.WINDREED_EXCLUDED_PUBLIC_SLUGS);
if (!admins.length) throw new Error("至少需要一个管理员邮箱。");
if (!editors.length) throw new Error("没有提供编辑者邮箱。");

envSource = setEnvValue(envSource, "WINDREED_ADMIN_EMAILS", admins.join(","));
envSource = setEnvValue(envSource, "WINDREED_ENABLE_PUBLIC_DOMAIN", "1");
await writeFile(envPath, envSource, "utf8");

const now = Date.now();
const statements = ["PRAGMA foreign_keys = ON;"];
for (const admin of admins) {
  statements.push(
    `DELETE FROM entry_permissions WHERE editor_email = ${sql(admin)};`,
    `DELETE FROM editors WHERE email = ${sql(admin)};`,
  );
}
for (const editor of editors) {
  const displayName = editor.split("@")[0];
  statements.push(
    `INSERT INTO editors (email, display_name, role, active, created_at, updated_at) VALUES (${[
      editor,
      displayName,
      "editor",
      1,
      now,
      now,
    ].map(sql).join(", ")}) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, role = 'editor', active = 1, updated_at = excluded.updated_at;`,
    `DELETE FROM entry_permissions WHERE editor_email = ${sql(editor)};`,
    `INSERT INTO entry_permissions (entry_id, editor_email, can_publish, created_at) SELECT id, ${sql(editor)}, 1, ${now} FROM entries${excludedSlugs.length ? ` WHERE slug NOT IN (${excludedSlugs.map(sql).join(", ")})` : ""};`,
  );
}

const excludedClause = excludedSlugs.length
  ? `slug NOT IN (${excludedSlugs.map(sql).join(", ")})`
  : "1 = 1";
statements.push(
  `UPDATE entries SET status = 'published', published_revision = current_revision, published_at = ${now}, updated_by = ${sql(admins[0])}, updated_at = ${now} WHERE ${excludedClause} AND (status <> 'published' OR published_revision IS NULL OR published_revision <> current_revision);`,
);
if (excludedSlugs.length) {
  statements.push(
    `UPDATE entries SET status = 'draft', published_revision = NULL, published_at = NULL, updated_by = ${sql(admins[0])}, updated_at = ${now} WHERE slug IN (${excludedSlugs.map(sql).join(", ")});`,
  );
}

await mkdir(resolve(root, ".wrangler"), { recursive: true });
await writeFile(sqlPath, `${statements.join("\n")}\n`, "utf8");
console.log(`生产切换配置已准备：管理员 ${admins.length}，编辑者 ${editors.length}，隐藏词条 ${excludedSlugs.length}。`);
console.log(`权限与发布 SQL：${sqlPath}`);

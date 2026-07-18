import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const sourcePath = resolve(root, "dist/server/wrangler.json");
const targetPath = resolve(root, "dist/server/wrangler.deploy.json");

try {
  await access(sourcePath);
} catch {
  throw new Error("没有找到 Cloudflare 构建产物。请先执行 npm run build。");
}

const required = [
  "CLOUDFLARE_D1_DATABASE_ID",
  "CLOUDFLARE_KV_NAMESPACE_ID",
  "CF_ACCESS_TEAM_DOMAIN",
  "CF_ACCESS_AUD",
  "WINDREED_ADMIN_EMAILS",
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  throw new Error(`.env.cloudflare 缺少：${missing.join(", ")}`);
}

const config = JSON.parse(await readFile(sourcePath, "utf8"));
config.name = process.env.CLOUDFLARE_WORKER_NAME?.trim() || "windreed-wiki";
config.d1_databases = [
  {
    binding: "DB",
    database_name: process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim() || "windreed-wiki",
    database_id: process.env.CLOUDFLARE_D1_DATABASE_ID.trim(),
    migrations_dir: "../../drizzle",
  },
];
config.kv_namespaces = [
  {
    binding: "PUBLIC_ARCHIVE_CACHE",
    id: process.env.CLOUDFLARE_KV_NAMESPACE_ID.trim(),
  },
];
config.vars = {
  ...(config.vars ?? {}),
  CF_ACCESS_TEAM_DOMAIN: process.env.CF_ACCESS_TEAM_DOMAIN.trim(),
  CF_ACCESS_AUD: process.env.CF_ACCESS_AUD.trim(),
  WINDREED_ADMIN_EMAILS: process.env.WINDREED_ADMIN_EMAILS.trim().toLowerCase(),
  WINDREED_EDITOR_HOST: "edit.windreed.wiki",
  WINDREED_PUBLIC_DOMAIN_ENABLED: process.env.WINDREED_ENABLE_PUBLIC_DOMAIN === "1" ? "1" : "0",
};
config.routes = [
  { pattern: "edit.windreed.wiki", custom_domain: true },
  ...(process.env.WINDREED_ENABLE_PUBLIC_DOMAIN === "1"
    ? [{ pattern: "windreed.wiki/*", zone_name: "windreed.wiki" }]
    : []),
];
config.assets = {
  ...(config.assets ?? {}),
  binding: "ASSETS",
  run_worker_first: true,
};

await writeFile(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
console.log(`Cloudflare 部署配置已生成：${targetPath}`);
console.log(`自定义域名：${config.routes.map((route) => route.pattern).join(", ")}`);

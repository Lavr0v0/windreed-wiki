import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("keeps the public shell on a compact, shared navigation request", async () => {
  const shell = await read("app/components/ArchiveShell.tsx");

  assert.match(shell, /fetch\("\/api\/public\/navigation"\)/);
  assert.match(shell, /let navigationEntriesRequest:/);
  assert.match(shell, /\}, \[isEditorRoute\]\);/);
  assert.doesNotMatch(shell, /fetch\("\/api\/public\/entries"/);
  assert.doesNotMatch(shell, /\}, \[pathname\]\);/);
});

test("does not eagerly prefetch every visible archive link", async () => {
  const [shell, memberCard, search] = await Promise.all([
    read("app/components/ArchiveShell.tsx"),
    read("app/components/MemberCard.tsx"),
    read("app/search/SearchClient.tsx"),
  ]);

  assert.match(shell, /className=\{pathname === href[\s\S]*?prefetch=\{false\}/);
  assert.match(memberCard, /prefetch=\{false\}/);
  assert.match(search, /className="search-result"[\s\S]*?prefetch=\{false\}/);
});

test("queries compact publication metadata for navigation and home without rereading it on articles", async () => {
  const [repository, publicArchive, home, article] = await Promise.all([
    read("app/editor/lib/repository.server.ts"),
    read("app/public-archive.server.ts"),
    read("app/page.tsx"),
    read("app/archive/[category]/[slug]/page.tsx"),
  ]);

  assert.match(repository, /listPublishedEntrySummaries/);
  assert.match(repository, /json_extract\(r\.payload, '\$\.title'\)/);
  assert.match(publicArchive, /getPublicArchiveNavigationEntries/);
  assert.match(home, /getPublicArchiveNavigationEntries/);
  assert.doesNotMatch(article, /getPublicArchiveNavigationEntries/);
  assert.match(publicArchive, /getPublicArchiveEntry = cache/);
});

test("removes the oversized handwriting font and edge-caches only public reads", async () => {
  const [layout, packageJson, styles, worker] = await Promise.all([
    read("app/layout.tsx"),
    read("package.json"),
    read("app/globals.css"),
    read("worker/index.ts"),
  ]);

  assert.doesNotMatch(layout, /lxgw-wenkai/i);
  assert.doesNotMatch(layout, /@fontsource-variable\/noto-serif-sc/);
  assert.doesNotMatch(packageJson, /lxgw-wenkai/i);
  assert.doesNotMatch(styles, /@import\s+["']tailwindcss/);
  assert.match(styles, /--hand:\s*var\(--serif\)/);
  assert.match(styles, /font-family:\s*"Windreed Noto Serif SC"/);
  const subset = await stat(new URL("../public/fonts/windreed-noto-serif-sc.woff2", import.meta.url));
  assert.ok(subset.size > 100_000 && subset.size < 800_000, `unexpected subset size: ${subset.size}`);
  assert.match(worker, /request\.method !== "GET"/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/public\/"\)/);
  assert.match(worker, /workerCache\.match/);
  assert.match(worker, /workerCache\.put/);
  assert.match(worker, /X-Windreed-Cache/);
});

test("uses global KV snapshots and D1 sessions for published archive reads", async () => {
  const [cache, repository, publicArchive, deploy] = await Promise.all([
    read("app/public-archive-cache.server.ts"),
    read("app/editor/lib/repository.server.ts"),
    read("app/public-archive.server.ts"),
    read("scripts/prepare-cloudflare-deploy.mjs"),
  ]);

  assert.match(cache, /PUBLIC_ARCHIVE_CACHE/);
  assert.match(cache, /cache\.list\(\{ prefix: publicArchiveCachePrefix/);
  assert.match(repository, /withSession\("first-unconstrained"\)/);
  assert.match(repository, /await invalidatePublicArchiveCache\(\)/);
  assert.match(publicArchive, /readPublicArchiveCache/);
  assert.match(publicArchive, /writePublicArchiveCache/);
  assert.match(deploy, /binding: "PUBLIC_ARCHIVE_CACHE"/);
});

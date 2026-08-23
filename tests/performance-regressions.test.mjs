import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("keeps the public shell on a compact, shared navigation request", async () => {
  const shell = await read("app/components/ArchiveShell.tsx");

  assert.match(shell, /fetch\("\/api\/public\/navigation"\)/);
  assert.match(shell, /let navigationEntriesRequest:/);
  assert.match(shell, /\}, \[englishMode, isEditorRoute\]\);/);
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

test("loads future-proof Chinese font ranges and edge-caches only public reads", async () => {
  const [layout, packageJson, styles, worker] = await Promise.all([
    read("app/layout.tsx"),
    read("package.json"),
    read("app/globals.css"),
    read("worker/index.ts"),
  ]);

  assert.doesNotMatch(layout, /lxgw-wenkai/i);
  assert.match(layout, /@fontsource-variable\/noto-serif-sc\/wght\.css/);
  assert.doesNotMatch(packageJson, /lxgw-wenkai/i);
  assert.doesNotMatch(styles, /@import\s+["']tailwindcss/);
  assert.match(styles, /--hand:\s*var\(--serif\)/);
  assert.match(styles, /--serif:\s*"Noto Serif SC Variable",\s*ui-serif/);
  assert.doesNotMatch(styles, /windreed-noto-serif-sc\.woff2/);
  assert.doesNotMatch(packageJson, /fonts:subset/);
  assert.match(worker, /request\.method !== "GET"/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/public\/"\)/);
  assert.match(worker, /workerCache\.match/);
  assert.match(worker, /workerCache\.put/);
  assert.match(worker, /X-Windreed-Cache/);
  assert.match(worker, /function defaultWorkerCache\(\) \{[\s\S]*?try \{[\s\S]*?catch \{/);
  assert.match(worker, /await workerCache\.match\(cacheKey\)[\s\S]*?workerCache = null/);
  assert.match(worker, /workerCache\.put\(cacheKey, cacheable\.clone\(\)\)\.catch/);
});

test("prefetches archive routes only after explicit pointer, focus, or touch intent", async () => {
  const pendingLink = await read("app/components/PendingLink.tsx");
  assert.match(pendingLink, /router\.prefetch\(href\)/);
  assert.match(pendingLink, /onPointerEnter/);
  assert.match(pendingLink, /onFocus/);
  assert.match(pendingLink, /onTouchStart/);
  assert.match(pendingLink, /setTimeout\(\(\) => setVisible\(true\), 180\)/);
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

test("keeps private source markdown behind the server boundary", async () => {
  const [archiveSource, englishContent, shell, search, markdownView, layout] = await Promise.all([
    read("app/archive-content.server.ts"),
    read("app/english-content.ts"),
    read("app/components/ArchiveShell.tsx"),
    read("app/search/SearchClient.tsx"),
    read("app/components/MarkdownView.tsx"),
    read("app/layout.tsx"),
  ]);

  assert.match(archiveSource, /^import "server-only";/);
  assert.match(englishContent, /^import "server-only";/);
  assert.match(archiveSource, /from "\.\/archive-heading"/);
  assert.match(markdownView, /from "\.\.\/archive-heading"/);
  assert.doesNotMatch(shell, /english-content/);
  assert.doesNotMatch(search, /english-content/);
  assert.doesNotMatch(layout, /english-content/);
  assert.match(shell, /englishNavigationManifest/);
});

test("does not publish filtered editorial notes in browser JavaScript", async () => {
  const assetsUrl = new URL("../dist/client/_next/static/", import.meta.url);
  const assetNames = (await readdir(assetsUrl)).filter((name) => name.endsWith(".js"));
  const clientJavaScript = (await Promise.all(
    assetNames.map((name) => readFile(new URL(name, assetsUrl), "utf8")),
  )).join("\n");

  for (const privateDraftPhrase of [
    "动手者与原因仍未揭晓",
    "立誓与得剑的先后未定",
    "当前均无资料",
  ]) {
    assert.doesNotMatch(clientJavaScript, new RegExp(privateDraftPhrase));
  }
});

test("defers optional smooth scrolling and throttles TOC measurements", async () => {
  const [motion, toc] = await Promise.all([
    read("app/components/MotionLayer.tsx"),
    read("app/components/ArticleToc.tsx"),
  ]);

  assert.match(motion, /import type Lenis from "lenis"/);
  assert.match(motion, /await import\("lenis"\)/);
  assert.doesNotMatch(motion, /import Lenis from "lenis"/);
  assert.doesNotMatch(motion, /document\.body\.scrollTop = 0/);
  assert.match(toc, /requestAnimationFrame\(updateFromScroll\)/);
  assert.doesNotMatch(toc, /new IntersectionObserver/);
});

test("runs every regression test in CI without invoking the obsolete static export", async () => {
  const [packageJson, workflow] = await Promise.all([
    read("package.json"),
    read(".github/workflows/pages.yml"),
  ]);

  assert.match(packageJson, /"test": "npm run build && npm run test:all"/);
  assert.match(packageJson, /"test:all": "node --test \\"tests\/\*\.test\.mjs\\""/);
  assert.match(workflow, /npm run typecheck/);
  assert.match(workflow, /npm run lint/);
  assert.match(workflow, /npm test/);
  assert.doesNotMatch(workflow, /GITHUB_PAGES|deploy-pages|upload-pages-artifact/);
});

test("uses the Vinext Windows static-cache fix for production assets", async () => {
  const packageJson = await read("package.json");

  assert.match(packageJson, /"vinext": "0\.0\.53"/);
  assert.doesNotMatch(packageJson, /patch-package/);
});

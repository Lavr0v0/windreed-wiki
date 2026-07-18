import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("keeps archive navigation animated, accessible, and prose free of drop caps", async () => {
  const [shell, styles, pendingLink] = await Promise.all([
    read("app/components/ArchiveShell.tsx"),
    read("app/globals.css"),
    read("app/components/PendingLink.tsx"),
  ]);

  assert.match(shell, /className="tree-disclosure-trigger"[\s\S]*?<span className="tree-section-name">/);
  assert.match(shell, /href=\{`\$\{siteHref\("\/search"\)\}\?section=\$\{section\.id\}`\}/);
  assert.match(shell, /className="top-search-submit"[\s\S]*?查阅[\s\S]*?搜索与索引/);
  assert.match(shell, /className="topbar-action top-search-link"/);
  assert.doesNotMatch(shell, /top-index-link/);
  assert.match(styles, /\.topbar-action\.top-search-link,\s*\n\.mobile-drawer-search[\s\S]*?display:\s*none/);
  assert.match(styles, /@media \(max-width: 960px\)[\s\S]*?\.topbar-action\.top-search-link \{ display: inline-flex; \}/);
  assert.match(shell, /aria-expanded=\{open\}/);
  assert.match(shell, /aria-controls=\{panelId\}/);
  assert.match(styles, /\.tree-children-shell\s*\{[\s\S]*?grid-template-rows:\s*0fr/);
  assert.match(styles, /\.tree-children-shell\[data-state="open"\]\s*\{[\s\S]*?grid-template-rows:\s*1fr/);
  assert.match(pendingLink, /useLinkStatus/);
  assert.doesNotMatch(styles, /::first-letter/);
});

test("keeps Merielle with companions and publishes Alberina's biography under fortunes", async () => {
  const [manifest, content] = await Promise.all([
    read("app/archive-manifest.ts"),
    read("app/archive-content.server.ts"),
  ]);

  assert.match(manifest, /slug: "merielle",[\s\S]*?category: "characters",[\s\S]*?section: "companions"/);
  assert.match(manifest, /slug: "alberina-biography",[\s\S]*?category: "history",[\s\S]*?section: "fortunes",[\s\S]*?title: "银鳞落在书页之外"/);
  assert.match(manifest, /slug: "relationships",[\s\S]*?category: "history",[\s\S]*?section: "lives"/);
  assert.match(content, /content\/source\/故事集\/际遇\/银鳞落在书页之外\.md\?raw/);
  assert.doesNotMatch(content, /content\/source\/(?:角色|传记|事件|地点|道具|设定|NPC)\//);
});

test("derives public navigation and routes from the published revision rather than a draft", async () => {
  const repository = await read("app/editor/lib/repository.server.ts");

  assert.match(repository, /json_extract\(r\.payload, '\$\.category'\) AS category/);
  assert.match(repository, /json_extract\(r\.payload, '\$\.section'\) AS section/);
  assert.match(repository, /category: payload\.category/);
  assert.match(repository, /section: payload\.section/);
});

test("keeps stable URL categories independent from the nine archive sections", async () => {
  const [content, editor] = await Promise.all([
    read("app/editor/lib/content.ts"),
    read("app/editor/components/EditorApp.tsx"),
  ]);

  assert.match(content, /ENTRY_SECTIONS\.some\(\(candidate\) => candidate\.value === requestedSection\)/);
  assert.match(editor, /option\.category === payload\.category \|\| option\.value === payload\.section/);
});

test("provides route-level loading folios with a CSS-only delayed reveal", async () => {
  const [rootLoading, archiveLoading, searchLoading, loadingView] = await Promise.all([
    read("app/loading.tsx"),
    read("app/archive/loading.tsx"),
    read("app/search/loading.tsx"),
    read("app/components/RouteLoading.tsx"),
  ]);

  assert.match(rootLoading, /variant="home"/);
  assert.match(archiveLoading, /variant="archive"/);
  assert.match(searchLoading, /variant="search"/);
  assert.match(loadingView, /role="status"/);
  assert.doesNotMatch(loadingView, /setTimeout|sleep|delay\(/);
});

test("keeps touch-device first paint visible while retaining desktop reveals", async () => {
  const [motionLayer, styles] = await Promise.all([
    read("app/components/MotionLayer.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(motionLayer, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(motionLayer, /!finePointer/);
  assert.match(motionLayer, /const revealFallback = window\.setTimeout/);
  assert.match(motionLayer, /\}, 900\);/);
  assert.match(motionLayer, /elements\.forEach\(\(element\) => element\.classList\.add\("is-revealed"\)\)/);
  assert.match(motionLayer, /window\.clearTimeout\(revealFallback\)/);
  assert.match(styles, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(styles, /\.route-stage \{ animation: none; \}/);
});

test("uses a single TOC scroll path with active and mobile chapter navigation", async () => {
  const [motionLayer, toc, styles] = await Promise.all([
    read("app/components/MotionLayer.tsx"),
    read("app/components/ArticleToc.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(motionLayer, /a\[data-toc-link\]/);
  assert.match(toc, /data-toc-link/);
  assert.match(toc, /aria-current=\{activeId === heading\.id \? "location"/);
  assert.match(toc, /mobile-toc-trigger/);
  assert.match(styles, /\.mobile-toc-sheet/);
});

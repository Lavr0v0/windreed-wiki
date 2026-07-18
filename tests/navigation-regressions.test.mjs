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

  assert.match(shell, /className="tree-section-name"/);
  assert.match(shell, /href=\{`\$\{siteHref\("\/search"\)\}\?section=\$\{section\.id\}`\}/);
  assert.match(shell, /aria-expanded=\{open\}/);
  assert.match(shell, /aria-controls=\{panelId\}/);
  assert.match(styles, /\.tree-children-shell\s*\{[\s\S]*?grid-template-rows:\s*0fr/);
  assert.match(styles, /\.tree-children-shell\[data-state="open"\]\s*\{[\s\S]*?grid-template-rows:\s*1fr/);
  assert.match(pendingLink, /useLinkStatus/);
  assert.doesNotMatch(styles, /::first-letter/);
});

test("provides route-level loading folios without adding artificial delays", async () => {
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
  assert.match(styles, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(styles, /\.route-stage \{ animation: none; \}/);
});

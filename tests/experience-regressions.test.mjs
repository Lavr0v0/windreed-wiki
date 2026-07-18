import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("keeps personal chronicles self-hosted and free of drop-cap markup", async () => {
  const pages = await Promise.all([
    read("public/characters/alberina/index.html"),
    read("public/characters/flavilar/index.html"),
    read("public/characters/shirul/index.html"),
  ]);
  const shared = await read("public/characters/shared/page.css");
  const cinzel = await stat(new URL("public/characters/shared/Cinzel-VariableFont_wght.woff2", root));

  for (const page of pages) {
    assert.doesNotMatch(page, /ajax\.googleapis|fonts\.googleapis|gstatic\.com/);
    assert.doesNotMatch(page, /drop-cap|first-letter:/);
    assert.match(page, /summary_large_image/);
  }
  for (const page of pages.slice(1)) {
    assert.match(page, /defer src="\.\.\/shared\/lenis\.min\.js"/);
    assert.match(page, /defer src="\.\.\/shared\/page\.js"/);
  }
  assert.match(shared, /Cinzel-VariableFont_wght\.woff2/);
  assert.ok(cinzel.size < 40_000, `unexpected Cinzel size: ${cinzel.size}`);
});

test("loads the Branch viewer and model only after a visitor asks for it", async () => {
  for (const directory of ["branch", "branch-openwork"]) {
    const [page, script] = await Promise.all([
      read(`public/characters/shirul/${directory}/index.html`),
      read(`public/characters/shirul/${directory}/branch.js`),
    ]);

    assert.doesNotMatch(page, /ajax\.googleapis|<script[^>]+model-viewer/);
    assert.doesNotMatch(page, /\ssrc="\.\/branch-sword(?:-openwork)?\.glb/);
    assert.match(page, /data-src="\.\/branch-sword(?:-openwork)?\.glb/);
    assert.match(page, /id="model-load-action"/);
    assert.match(script, /import\("\.\/vendor\/model-viewer\.min\.js"\)/);
    assert.match(script, /model\.setAttribute\("src", model\.dataset\.src\)/);
  }
});

test("ships persistent editor feedback, tablet catalogue drawer, and lazy heavy panels", async () => {
  const [editor, styles] = await Promise.all([
    read("app/editor/components/EditorApp.tsx"),
    read("app/edit/editor.css"),
  ]);
  assert.match(editor, /type SaveStatus = "saved" \| "dirty" \| "saving" \| "error"/);
  assert.match(editor, /const RichEditor = lazy/);
  assert.match(editor, /const CollaboratorsPanel = lazy/);
  assert.match(editor, /const ContentSyncPanel = lazy/);
  assert.match(styles, /@media \(max-width: 1024px\)/);
  assert.match(styles, /\.editor-sidebar\[data-state="open"\]/);
});

test("publishes share and crawler metadata without generated portraits", async () => {
  const [layout, robots, sitemap, socialScript] = await Promise.all([
    read("app/layout.tsx"),
    read("app/robots.ts"),
    read("app/sitemap.ts"),
    read("scripts/build-social-card.mjs"),
  ]);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /\/og\.png/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /getPublicArchiveEntries/);
  assert.match(socialScript, /windreed-logo-on-dark\.svg/);
});

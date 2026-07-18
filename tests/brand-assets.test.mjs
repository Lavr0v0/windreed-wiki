import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("uses the same contextual logo assets across the archive and scriptorium", async () => {
  const [shell, home, editor, layout, styles, editorStyles, onDark, favicon] = await Promise.all([
    read("app/components/ArchiveShell.tsx"),
    read("app/page.tsx"),
    read("app/editor/components/EditorApp.tsx"),
    read("app/layout.tsx"),
    read("app/globals.css"),
    read("app/edit/editor.css"),
    read("public/brand/final/windreed-logo-on-dark.svg"),
    read("public/brand/final/windreed-logo-favicon.svg"),
  ]);

  await Promise.all([
    access(new URL("public/brand/windreed-wayfarers-mark-user-refined.svg", root)),
    access(new URL("public/brand/final/windreed-logo-on-dark.svg", root)),
    access(new URL("public/brand/final/windreed-logo-favicon.svg", root)),
  ]);

  assert.match(shell, /windreed-logo-on-dark\.svg/);
  assert.match(home, /windreed-logo-on-dark\.svg/);
  assert.match(editor, /windreed-logo-on-dark\.svg/);
  assert.match(editor, /windreed-wayfarers-mark-user-refined\.svg/);
  assert.match(layout, /windreed-logo-favicon\.svg/);
  assert.match(shell, /https:\/\/edit\.windreed\.wiki\//);

  assert.doesNotMatch(onDark, /<rect\b/);
  assert.match(onDark, /#F3EFE6/);
  assert.match(onDark, /#D6AB4D/);
  assert.match(favicon, /<rect[^>]+fill="#071A2B"/);

  assert.match(styles, /--topbar-control-height:\s*42px/);
  assert.match(styles, /\.top-search[\s\S]*?height:\s*var\(--topbar-control-height\)/);
  assert.match(styles, /\.topbar-action[\s\S]*?height:\s*var\(--topbar-control-height\)/);
  assert.match(editorStyles, /grid-template-rows:\s*72px/);
  assert.match(editorStyles, /\.editor-account a[\s\S]*?height:\s*42px/);
});

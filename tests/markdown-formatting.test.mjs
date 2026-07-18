import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("renders single-asterisk Markdown emphasis as italic text", async () => {
  const [view, styles] = await Promise.all([
    readFile(new URL("app/components/MarkdownView.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(view, /\\\*\[\^\*\\n\]\+\\\*/);
  assert.match(view, /token\.startsWith\("\*"\)/);
  assert.match(view, /<em key=\{key\}>\{renderInline\(token\.slice\(1, -1\)\)\}<\/em>/);
  assert.match(styles, /\.markdown-body em\s*\{\s*font-style:\s*italic/);
});

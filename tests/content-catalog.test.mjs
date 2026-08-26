import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { loadLocalArchive } from "../scripts/lib/local-archive.mjs";

test("loads one source file for every public entry through the sync runtime", async () => {
  const archive = await loadLocalArchive();
  assert.equal(archive.sections.length, 9);
  assert.equal(archive.entries.length, 20);
  assert.equal(archive.manifest.length, 20);
  assert.equal(archive.sources.length, 20);
  assert.equal(new Set(archive.manifest.map((entry) => entry.slug)).size, 20);
  assert.equal(new Set(archive.sources.map((entry) => entry.sourcePath.toLocaleLowerCase("zh-CN"))).size, 20);
  assert.ok(archive.sources.every((entry) => entry.sourcePath.endsWith(".md")));
  assert.ok(archive.manifest.every((entry) => !("sourcePath" in entry) && !("sourceRegion" in entry)));
});

test("passes the complete nine-volume catalog and local mirror audit", () => {
  const output = execFileSync(process.execPath, ["scripts/content-catalog.mjs"], {
    cwd: resolve(import.meta.dirname, ".."),
    encoding: "utf8",
  });
  assert.match(output, /9 卷，20 个公开词条，20 个独立源文件/);
});

test("uses the same inode for the Obsidian view when the parent vault exists", async (context) => {
  const siteRoot = resolve(import.meta.dirname, "..");
  const vaultRoot = resolve(siteRoot, "..");
  try {
    await stat(resolve(vaultRoot, ".obsidian"));
  } catch {
    context.skip("CI checkout does not include the parent Obsidian vault.");
    return;
  }

  const relativePath = "档案组/卷中人/雪露 Shirul.md";
  const [source, mirror] = await Promise.all([
    stat(resolve(siteRoot, "content", "source", relativePath), { bigint: true }),
    stat(resolve(vaultRoot, relativePath), { bigint: true }),
  ]);
  assert.equal(source.dev, mirror.dev);
  assert.equal(source.ino, mirror.ino);
});

test("writes future online merge candidates into nine-volume directories", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => (
    readFile(resolve(import.meta.dirname, "..", "scripts", "content-sync.mjs"), "utf8")
  ));
  assert.match(source, /collection\.directory, section\.directory/);
  assert.match(source, /source_path:/);
  assert.doesNotMatch(source, /resolve\(incomingDir, `\$\{item\.slug\}\.md`\)/);
});

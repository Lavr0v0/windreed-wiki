import test from "node:test";
import assert from "node:assert/strict";
import {
  classifySync,
  createLocalPackage,
  payloadHash,
  updateCommonBase,
} from "../scripts/lib/content-sync-core.mjs";

function payload(slug, summary = "共同内容") {
  return {
    slug,
    category: "world",
    section: "lore",
    title: slug,
    englishTitle: "",
    aliases: [],
    summary,
    monogram: "W",
    accent: "#668471",
    characterRole: "",
    personalPage: "",
    presentation: "archive",
    facts: [],
    relatedSlugs: [],
    sourceLabel: "test",
    body: { type: "doc", content: [{ type: "paragraph" }] },
  };
}

function local(entryPayload) {
  return { payload: entryPayload };
}

function online(entryPayload, baseRevision = 4) {
  return { baseRevision, payload: entryPayload };
}

function syncPackage(entries) {
  return {
    format: "windreed-content-sync",
    version: 1,
    source: "online",
    generatedAt: "2026-07-17T00:00:00.000Z",
    entries,
  };
}

function base(entryPayload, revision = 4) {
  return { entries: { [entryPayload.slug]: { hash: payloadHash(entryPayload), revision } } };
}

test("相同内容被识别为已同步并可建立共同基准", () => {
  const shared = payload("emberford");
  const result = classifySync([local(shared)], syncPackage([online(shared, 7)]));
  assert.equal(result[0].status, "in-sync");

  const state = updateCommonBase({ entries: {} }, result);
  assert.deepEqual(state.entries.emberford, {
    hash: payloadHash(shared),
    revision: 7,
  });
});

test("只修改本地时生成带基准版本的推送草稿", () => {
  const original = payload("shirul");
  const changed = payload("shirul", "本地修改");
  const result = classifySync(
    [local(changed)],
    syncPackage([online(original)]),
    base(original),
  );
  assert.equal(result[0].status, "local-changed");

  const created = createLocalPackage(result);
  assert.equal(created.blocked.length, 0);
  assert.equal(created.syncPackage.source, "local");
  assert.deepEqual(created.syncPackage.entries, [{ baseRevision: 4, payload: changed }]);
});

test("线上变化会暂停本地推送", () => {
  const original = payload("neverwinter");
  const changedOnline = payload("neverwinter", "线上修改");
  const result = classifySync(
    [local(original)],
    syncPackage([online(changedOnline, 5)]),
    base(original),
  );
  assert.equal(result[0].status, "online-changed");

  const created = createLocalPackage(result);
  assert.deepEqual(created.syncPackage.entries, []);
  assert.deepEqual(created.blocked, ["neverwinter"]);
});

test("两边都变化时报告冲突且不进入推送包", () => {
  const original = payload("redlarch");
  const result = classifySync(
    [local(payload("redlarch", "本地修改"))],
    syncPackage([online(payload("redlarch", "线上修改"), 5)]),
    base(original),
  );
  assert.equal(result[0].status, "conflict");
  assert.deepEqual(createLocalPackage(result).blocked, ["redlarch"]);
});

test("仅本地存在的词条以无基准版本的新草稿推送", () => {
  const createdPayload = payload("new-entry");
  const result = classifySync([local(createdPayload)], syncPackage([]));
  assert.equal(result[0].status, "local-only");
  assert.deepEqual(createLocalPackage(result).syncPackage.entries, [
    { baseRevision: null, payload: createdPayload },
  ]);
});

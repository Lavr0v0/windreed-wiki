import assert from "node:assert/strict";

const baseUrl = process.env.WINDREED_EDITOR_TEST_URL ?? "http://localhost:4311";
const writeHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "x-windreed-editor": "1",
};

async function json(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

const initial = await json("/api/admin/entries", { headers: { Accept: "application/json" } });
assert.equal(initial.response.status, 200, "本地编辑 API 应可访问");

const candidate = initial.data.entries.find(
  (entry) => entry.canPublish && entry.currentRevision === entry.publishedRevision,
);
assert.ok(candidate, "需要至少一个当前版本与公开版本一致的可发布词条");

const cleanPayload = candidate.payload;
const originalPublishedRevision = candidate.publishedRevision;
const firstDraft = await json(`/api/admin/entries/${candidate.id}/draft`, {
  method: "PUT",
  headers: writeHeaders,
  body: JSON.stringify({
    expectedRevision: candidate.currentRevision,
    payload: cleanPayload,
    note: "本地并发与发布隔离检查",
  }),
});
assert.equal(firstDraft.response.status, 200, "使用正确版本号保存草稿应成功");

const staleDraft = await json(`/api/admin/entries/${candidate.id}/draft`, {
  method: "PUT",
  headers: writeHeaders,
  body: JSON.stringify({
    expectedRevision: candidate.currentRevision,
    payload: cleanPayload,
    note: "这次保存应因版本过期被拒绝",
  }),
});
assert.equal(staleDraft.response.status, 409, "过期版本保存必须被拒绝");

const publicBeforePublish = await json("/api/public/entries");
const stillPublished = publicBeforePublish.data.entries.find((entry) => entry.id === candidate.id);
assert.equal(
  stillPublished.publishedRevision,
  originalPublishedRevision,
  "草稿保存不得改变公开版本",
);

const blockedPayload = {
  ...cleanPayload,
  summary: `${cleanPayload.summary} 待定`,
};
const blockedDraft = await json(`/api/admin/entries/${candidate.id}/draft`, {
  method: "PUT",
  headers: writeHeaders,
  body: JSON.stringify({
    expectedRevision: firstDraft.data.entry.currentRevision,
    payload: blockedPayload,
    note: "本地公开内容拦截检查",
  }),
});
assert.equal(blockedDraft.response.status, 200, "含拦截词的内容仍可作为私有草稿保存");

const blockedPublish = await json(`/api/admin/entries/${candidate.id}/publish`, {
  method: "POST",
  headers: writeHeaders,
  body: JSON.stringify({ expectedRevision: blockedDraft.data.entry.currentRevision }),
});
assert.equal(blockedPublish.response.status, 422, "含拦截词的草稿不得发布");

const restoredDraft = await json(`/api/admin/entries/${candidate.id}/draft`, {
  method: "PUT",
  headers: writeHeaders,
  body: JSON.stringify({
    expectedRevision: blockedDraft.data.entry.currentRevision,
    payload: cleanPayload,
    note: "恢复本地公开内容检查前的正文",
  }),
});
assert.equal(restoredDraft.response.status, 200, "清理测试草稿应成功");

const published = await json(`/api/admin/entries/${candidate.id}/publish`, {
  method: "POST",
  headers: writeHeaders,
  body: JSON.stringify({ expectedRevision: restoredDraft.data.entry.currentRevision }),
});
assert.equal(published.response.status, 200, "恢复后的干净版本应可发布");
assert.equal(
  published.data.entry.currentRevision,
  published.data.entry.publishedRevision,
  "测试结束后当前版本应与公开版本一致",
);

console.log(`Editor smoke test passed: ${candidate.slug} revision ${published.data.entry.currentRevision}.`);

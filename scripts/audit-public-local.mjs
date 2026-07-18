import assert from "node:assert/strict";

const baseUrl = process.env.WINDREED_PUBLIC_TEST_URL ?? "http://localhost:4311";
const forbidden = [
  /ChatGPT/iu,
  /Claude/iu,
  /问卷|答卷/u,
  /待定|待补|TODO/iu,
  /工作记录|对话记录|检查报告/u,
  /候选地名|备选名/u,
  /作者尚未|现有资料|现有档案/u,
  /原始表格|原始文件/u,
];

async function read(path) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, 200, `${path} 应返回 200`);
  return response.text();
}

const publicDataText = await read("/api/public/entries");
const publicData = JSON.parse(publicDataText);
const paths = [
  "/",
  ...publicData.entries.map((entry) => `/archive/${entry.category}/${entry.slug}`),
];

for (const path of paths) {
  const html = await read(path);
  const issue = forbidden.find((pattern) => pattern.test(html));
  assert.ok(!issue, `${path} 出现禁止公开的措辞：${issue}`);
}

const apiIssue = forbidden.find((pattern) => pattern.test(publicDataText));
assert.ok(!apiIssue, `公开 API 出现禁止公开的措辞：${apiIssue}`);
console.log(`Public archive audit passed: ${paths.length} pages and the public API.`);

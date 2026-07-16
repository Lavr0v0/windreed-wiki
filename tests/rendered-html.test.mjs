import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function getWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

async function render(path = "/") {
  const worker = await getWorker();
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const routes = [
  "/archive/characters/shirul",
  "/archive/characters/alberina",
  "/archive/characters/flavilar",
  "/archive/characters/pheiron",
  "/archive/characters/skamos",
  "/archive/characters/ariel",
  "/archive/characters/merielle",
  "/archive/world/oath-of-the-ancients",
  "/archive/world/miracle-light",
  "/archive/world/transfiguration",
  "/archive/world/branch",
  "/archive/world/neverwinter",
  "/archive/world/redlarch",
  "/archive/world/mere-kryptgarden",
  "/archive/world/evereska",
  "/archive/history/timeline",
  "/archive/history/relationships",
];

const forbiddenPublicText =
  /ChatGPT|人工智能|问卷|待定|待补|银月城|现有资料|现有档案|候选方案|工作记录|codex-preview/i;

test("renders the finished archive home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Windreed Wayfarers<\/title>/i);
  assert.match(html, /The Windreed Wayfarers/);
  assert.match(html, /风芦旅人/);
  assert.match(html, /1492 DR/);
  assert.match(html, /人物档案/);
  assert.doesNotMatch(html, forbiddenPublicText);
  assert.doesNotMatch(html, /react-loading-skeleton|Your site is taking shape/i);
});

test("every published archive route renders and passes the content policy", async () => {
  for (const route of routes) {
    const response = await render(route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /ARCHIVE ENTRY/, route);
    assert.doesNotMatch(html, forbiddenPublicText, route);
    assert.doesNotMatch(html, /芦溪村|银桦林/, route);
  }
});

test("publishes the final Neverwinter identity only", async () => {
  const response = await render("/archive/world/neverwinter");
  const html = await response.text();
  assert.match(html, /绝冬城/);
  assert.match(html, /Neverwinter/);
  assert.doesNotMatch(html, /养病的城|银月城/);
});

test("search receives only approved archive text", async () => {
  const response = await render("/search?q=%E9%9B%AA%E9%9C%B2");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /全文索引/);
  assert.match(html, /雪露/);
  assert.doesNotMatch(html, forbiddenPublicText);
});

test("removes the disposable starter surface", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", projectRoot)));
});

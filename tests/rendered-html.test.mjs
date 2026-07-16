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
  "/archive/world/emberford",
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

test("publishes the 5E Neverwinter name and keeps the old translation as an alias", async () => {
  const response = await render("/archive/world/neverwinter");
  const html = await response.text();
  assert.match(html, /无冬城/);
  assert.match(html, /绝冬城/);
  assert.match(html, /Neverwinter/);
  assert.doesNotMatch(html, /养病的城|银月城/);
});

test("uses checked 5E names for glossary entries", async () => {
  const cases = [
    ["/archive/world/redlarch", /红松镇/, /Red Larch/],
    ["/archive/world/oath-of-the-ancients", /古贤之誓/, /Oath of the Ancients/],
    ["/archive/world/evereska", /艾弗瑞斯卡/, /Evereska/],
    ["/archive/world/mere-kryptgarden", /亡者沼泽/, /Mere of Dead Men/],
  ];

  for (const [route, chineseName, englishName] of cases) {
    const response = await render(route);
    const html = await response.text();
    assert.match(html, chineseName, route);
    assert.match(html, englishName, route);
  }
});

test("keeps glossary entries out of the sidebar and opens them from body links", async () => {
  const homeResponse = await render();
  const home = await homeResponse.text();
  const tree = home.match(/<nav class="archive-tree"[\s\S]*?<\/nav>/)?.[0] ?? "";
  assert.match(tree, /神迹之光/);
  assert.match(tree, /「枝桠」/);
  assert.doesNotMatch(tree, /红松镇|无冬城|安柏弗|古贤之誓|艾弗瑞斯卡/);
  assert.match(tree, /正式团员/);
  assert.match(tree, /同行者/);

  const treeGroups = [...tree.matchAll(/<details[^>]*>[\s\S]*?<\/details>/g)].map((match) => match[0]);
  const memberGroup = treeGroups.find((group) => group.includes("正式团员")) ?? "";
  const associateGroup = treeGroups.find((group) => group.includes("同行者")) ?? "";
  assert.match(memberGroup, /雪露/);
  assert.match(memberGroup, /阿瑞尔/);
  assert.doesNotMatch(memberGroup, /梅莉艾尔/);
  assert.match(associateGroup, /梅莉艾尔/);
  assert.doesNotMatch(associateGroup, /雪露/);

  const shirulResponse = await render("/archive/characters/shirul");
  const shirul = await shirulResponse.text();
  assert.match(shirul, /glossary-trigger/);
  assert.match(shirul, /aria-haspopup="dialog"/);
});

test("publishes Emberford as Shirul's confirmed homeland", async () => {
  const response = await render("/archive/world/emberford");
  const html = await response.text();
  assert.match(html, /安柏弗/);
  assert.match(html, /Emberford/);
  assert.match(html, /雪露/);
  assert.doesNotMatch(html, /芦溪村/);
});

test("search receives only approved archive text", async () => {
  const response = await render("/search?q=%E9%9B%AA%E9%9C%B2");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /全文索引/);
  assert.match(html, /雪露/);
  assert.doesNotMatch(html, forbiddenPublicText);
});

test("gives formal party members their own public collection", async () => {
  const response = await render("/search?category=members");
  assert.equal(response.status, 200);
  const html = await response.text();
  const visibleResults = [...html.matchAll(/<a[^>]*class="search-result"[\s\S]*?<\/a>/g)]
    .map((match) => match[0])
    .join("\n");
  assert.match(html, /正式团员/);
  assert.match(visibleResults, /雪露/);
  assert.match(visibleResults, /阿瑞尔/);
  assert.doesNotMatch(visibleResults, /梅莉艾尔/);

  const memberResponse = await render("/archive/characters/shirul");
  const memberHtml = await memberResponse.text();
  assert.match(memberHtml, /PARTY MEMBER/);
  assert.match(memberHtml, /01(?:<!-- -->)? \/ 06/);
});

test("uses desktop Lenis while preserving native touch scrolling and reduced motion", async () => {
  const [motionLayer, packageJson] = await Promise.all([
    readFile(new URL("../app/components/MotionLayer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(motionLayer, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(motionLayer, /syncTouch: false/);
  assert.match(motionLayer, /prefers-reduced-motion: reduce/);
  assert.equal(JSON.parse(packageJson).dependencies.lenis, "1.3.25");
});

test("renders a styled archive 404", async () => {
  const response = await render("/a-road-not-recorded");
  assert.equal(response.status, 404);

  const html = await response.text();
  assert.match(html, /此路未载于档案/);
  assert.match(html, /清风拂过这里，他们已经去往新的旅途。/);
  assert.match(html, /返回档案总览/);
  assert.match(html, /检索公开档案/);
  assert.doesNotMatch(html, forbiddenPublicText);

  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const titleRule = styles.match(/\.not-found-copy h1\s*\{[\s\S]*?\}/)?.[0] ?? "";
  assert.match(titleRule, /white-space:\s*nowrap/);
  assert.match(titleRule, /word-break:\s*keep-all/);
  assert.match(styles, /@media \(max-width: 1220px\)[\s\S]*?\.not-found-card/);
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

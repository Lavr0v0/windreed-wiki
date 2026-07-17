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
  /ChatGPT|Claude|人工智能|问卷|答卷|待定|待补|银月城|现有资料|现有档案|候选方案|工作记录|待跑团|均填|留白|当前均无资料|当前不增加|codex-preview|starter project|your site is taking shape|答卷\/|\.md\b|\.xlsx\b/i;

test("renders the finished archive home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Windreed Wayfarers<\/title>/i);
  assert.match(html, /The Windreed Wayfarers/);
  assert.match(html, /风芦旅人/);
  assert.match(html, /1492 DR/);
  assert.match(html, /卷册索引/);
  assert.doesNotMatch(html, forbiddenPublicText);
  assert.doesNotMatch(html, /世界与设定索引|雪露的村庄/);
  assert.doesNotMatch(html, /react-loading-skeleton|Your site is taking shape/i);
});

test("every published archive route renders and passes the content policy", async () => {
  for (const route of routes) {
    const response = await render(route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /THE WINDREED CHRONICLES/, route);
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

test("uses the fixed bilingual archive and story navigation", async () => {
  const homeResponse = await render();
  const home = await homeResponse.text();
  const tree = home.match(/<nav class="archive-tree"[\s\S]*?<\/nav>/)?.[0] ?? "";
  const fixedLabels = [
    "ARCHIVES", "LIVES", "卷中人", "COMPANIONS", "同行者", "PLACES", "风物",
    "RELICS", "行囊", "LORE", "见闻", "HERALDRY", "纹章", "STORIES",
    "TALES", "逸闻", "THE CHRONICLE", "长路", "FORTUNES", "际遇",
  ];
  let lastPosition = -1;
  for (const label of fixedLabels) {
    const position = tree.indexOf(label, lastPosition + 1);
    assert.ok(position > lastPosition, `${label} should appear in the fixed navigation order`);
    lastPosition = position;
  }

  const treeGroups = [...tree.matchAll(/<details[^>]*>[\s\S]*?<\/details>/g)].map((match) => match[0]);
  const memberGroup = treeGroups.find((group) => group.includes("LIVES")) ?? "";
  const associateGroup = treeGroups.find((group) => group.includes("COMPANIONS")) ?? "";
  const placesGroup = treeGroups.find((group) => group.includes("PLACES")) ?? "";
  assert.match(memberGroup, /雪露/);
  assert.match(memberGroup, /阿瑞尔/);
  assert.doesNotMatch(memberGroup, /梅莉艾尔/);
  assert.match(associateGroup, /梅莉艾尔/);
  assert.doesNotMatch(associateGroup, /雪露/);
  assert.match(placesGroup, /红松镇/);
  assert.match(placesGroup, /无冬城/);
  assert.match(placesGroup, /安柏弗/);

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

test("removes empty headings left behind by unpublished editorial sections", async () => {
  const response = await render("/archive/world/miracle-light");
  const html = await response.text();
  assert.doesNotMatch(html, /两种解释/);
});

test("search receives only approved archive text", async () => {
  const response = await render("/search?q=%E9%9B%AA%E9%9C%B2");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /全文索引/);
  assert.match(html, /雪露/);
  assert.doesNotMatch(html, forbiddenPublicText);
});

test("gives every published entry its requested chronicle section", async () => {
  const response = await render("/search?section=lives");
  assert.equal(response.status, 200);
  const html = await response.text();
  const visibleResults = [...html.matchAll(/<a[^>]*class="search-result"[\s\S]*?<\/a>/g)]
    .map((match) => match[0])
    .join("\n");
  assert.match(html, /LIVES/);
  assert.match(html, /卷中人/);
  assert.match(visibleResults, /雪露/);
  assert.match(visibleResults, /阿瑞尔/);
  assert.doesNotMatch(visibleResults, /梅莉艾尔/);

  const memberResponse = await render("/archive/characters/shirul");
  const memberHtml = await memberResponse.text();
  assert.match(memberHtml, /PARTY MEMBER/);
  assert.match(memberHtml, /LIVES/);
  assert.match(memberHtml, /卷中人/);
  assert.match(memberHtml, /01(?:<!-- -->)? \/ 06/);

  const sectionCases = [
    ["places", /红松镇/, /「枝桠」/],
    ["relics", /「枝桠」/, /红松镇/],
    ["lore", /古贤之誓/, /队伍时间线/],
    ["chronicle", /队伍时间线/, /关系档案/],
    ["fortunes", /关系档案/, /队伍时间线/],
  ];
  for (const [section, included, excluded] of sectionCases) {
    const sectionResponse = await render(`/search?section=${section}`);
    const sectionHtml = await sectionResponse.text();
    const sectionResults = [...sectionHtml.matchAll(/<a[^>]*class="search-result"[\s\S]*?<\/a>/g)]
      .map((match) => match[0])
      .join("\n");
    assert.match(sectionResults, included, section);
    assert.doesNotMatch(sectionResults, excluded, section);
  }
});

test("uses desktop Lenis while preserving native touch scrolling and reduced motion", async () => {
  const [motionLayer, packageJson] = await Promise.all([
    readFile(new URL("../app/components/MotionLayer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(motionLayer, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(motionLayer, /syncTouch: false/);
  assert.match(motionLayer, /prefers-reduced-motion: reduce/);
  assert.match(motionLayer, /scrollTo\(0, \{ immediate: true \}\)/);
  assert.match(motionLayer, /window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/);
  assert.equal(JSON.parse(packageJson).dependencies.lenis, "1.3.25");
});

test("keeps archive navigation scrollable without visible browser chrome", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.desktop-sidebar,\s*\n\.mobile-sidebar[\s\S]*?scrollbar-width:\s*none/);
  assert.match(styles, /\.desktop-sidebar::\-webkit-scrollbar,\s*\n\.mobile-sidebar::\-webkit-scrollbar[\s\S]*?display:\s*none/);
  assert.match(styles, /@media \(max-width: 960px\)[\s\S]*?\.mobile-sidebar\s*\{[\s\S]*?background-color:\s*var\(--paper-light\)/);
});

test("ships a reliable Chinese serif on iPad instead of falling back to sans-serif", async () => {
  const [layout, styles, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /@fontsource-variable\/noto-serif-sc\/wght\.css/);
  assert.match(styles, /--serif:\s*"Noto Serif SC Variable",\s*ui-serif/);
  assert.match(styles, /"Songti SC"/);
  assert.match(styles, /"STSongti-SC-Regular"/);
  assert.equal(
    JSON.parse(packageJson).dependencies["@fontsource-variable/noto-serif-sc"],
    "5.2.10",
  );
});

test("presents party member names as handwritten chronicle entries", async () => {
  const [response, layout, styles, packageJson] = await Promise.all([
    render(),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const html = await response.text();
  assert.match(html, /卷中录名/);
  assert.match(html, /FOLIO/);
  assert.match(html, /所记身份/);
  assert.match(html, /展卷阅其人/);
  assert.match(html, /data-logo-slot="site"/);
  assert.match(html, /data-logo-slot="member"/);
  assert.match(layout, /@fontsource\/lxgw-wenkai\/500\.css/);
  assert.match(styles, /--hand:\s*"LXGW WenKai"/);
  assert.match(styles, /\.member-card-name::after/);
  assert.equal(JSON.parse(packageJson).dependencies["@fontsource/lxgw-wenkai"], "5.2.5");
});

test("links published character archives to their personal chronicles", async () => {
  const [shirul, alberina, flavilar, pheiron] = await Promise.all([
    render("/archive/characters/shirul").then((response) => response.text()),
    render("/archive/characters/alberina").then((response) => response.text()),
    render("/archive/characters/flavilar").then((response) => response.text()),
    render("/archive/characters/pheiron").then((response) => response.text()),
  ]);
  assert.match(shirul, /href="\/DnD\/Shirul\/"/);
  assert.match(alberina, /href="\/DnD\/Alberina\/"/);
  assert.match(flavilar, /href="\/DnD\/Flavilar\/"/);
  assert.doesNotMatch(pheiron, /PERSONAL CHRONICLE/);
});

test("ships the standalone personal chronicles with local runtime assets", async () => {
  const pages = [
    "../public/DnD/index.html",
    "../public/DnD/Alberina/index.html",
    "../public/DnD/Flavilar/index.html",
    "../public/DnD/Shirul/index.html",
    "../public/DnD/shared/page.css",
    "../public/DnD/shared/lenis.min.js",
  ];
  await Promise.all(pages.map((path) => access(new URL(path, import.meta.url))));
  const index = await readFile(new URL("../public/DnD/index.html", import.meta.url), "utf8");
  assert.match(index, /https:\/\/windreed\.wiki\/DnD\//);
  assert.match(index, /href="Alberina\/"/);
  assert.match(index, /href="Flavilar\/"/);
  assert.match(index, /href="Shirul\/"/);
  assert.doesNotMatch(index, forbiddenPublicText);
});

test("renders archive prose immediately without an intersection reveal gate", async () => {
  const archivePage = await readFile(
    new URL("../app/archive/[category]/[slug]/page.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(archivePage, /<div data-reveal>\s*<MarkdownView/);
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

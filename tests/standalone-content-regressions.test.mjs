import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("keeps standalone character chronicles on the current public terminology", async () => {
  const [alberina, flavilar] = await Promise.all([
    read("public/characters/alberina/index.html"),
    read("public/characters/flavilar/index.html"),
  ]);
  const pages = `${alberina}\n${flavilar}`;

  assert.doesNotMatch(pages, /亡者之沼|绝冬林|上古之誓|Redlarch/);
  assert.match(alberina, /无冬森林/);
  assert.match(alberina, /古贤之誓/);
  assert.match(alberina, /红松镇/);
  assert.match(flavilar, /无冬森林/);
  assert.match(flavilar, /亡者沼泽/);
});

test("describes Flavilar's human appearance as the choker's attuned effect", async () => {
  const flavilar = await read("public/characters/flavilar/index.html");

  assert.match(flavilar, /小拉的咪西颈环/);
  assert.match(flavilar, /保持同调/);
  assert.match(flavilar, /固定的人类外貌/);
  assert.match(flavilar, /约两米高，黑发绿眼/);
  assert.match(flavilar, /摘下颈环，她便恢复原形/);
  assert.doesNotMatch(flavilar, /施展变形术|>Polymorph</);
});

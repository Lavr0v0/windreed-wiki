import teamRaw from "../content/source/风芦旅人.md?raw";
import shirulRaw from "../content/source/角色/雪露 Shirul.md?raw";
import alberinaRaw from "../content/source/角色/阿尔贝莉娜 Alberina.md?raw";
import flavilarRaw from "../content/source/角色/芙勒维拉 Flavilar.md?raw";
import pheironRaw from "../content/source/角色/佩伦 Pheiron.md?raw";
import skamosRaw from "../content/source/角色/斯卡摩斯 Skamos.md?raw";
import arielRaw from "../content/source/角色/阿瑞尔 Ariel.md?raw";
import merielleRaw from "../content/source/NPC/梅莉艾尔 Merielle.md?raw";
import oathRaw from "../content/source/设定/远古誓言.md?raw";
import miracleLightRaw from "../content/source/设定/神迹之光.md?raw";
import transfigurationRaw from "../content/source/设定/变形术.md?raw";
import branchRaw from "../content/source/道具/「枝桠」.md?raw";
import geographyRaw from "../content/source/设定/地理.md?raw";
import neverwinterRaw from "../content/source/地点/养病的城.md?raw";
import evereskaRaw from "../content/source/势力/高精灵族群.md?raw";
import timelineRaw from "../content/source/事件/风芦旅人时间线.md?raw";
import {
  archiveHref,
  archiveManifest,
  type ArchiveManifestEntry,
} from "./archive-manifest";

export type ArchiveHeading = {
  id: string;
  level: 2 | 3;
  title: string;
};

export type ArchiveEntry = ArchiveManifestEntry & {
  body: string;
  headings: ArchiveHeading[];
  plainText: string;
  source: string;
};

type SourceSpec = {
  raw: string;
  source: string;
  section?: string;
};

const confirmedRelationships = `
## 队伍归属

- 雪露、阿尔贝莉娜、芙勒维拉、佩伦、斯卡摩斯与阿瑞尔均为风芦旅人的正式成员。

## 核心人际

- **阿尔贝莉娜 → 雪露**：从雪露约五岁起陪伴并引导她。
- **雪露 → 阿尔贝莉娜**：依赖她，也想证明自己已经长大。
- **雪露 ↔ 芙勒维拉**：共同承担队伍前排。
- **阿尔贝莉娜 → 芙勒维拉**：教导她，帮助她重新建立语言、知识与常识。
- **雪露 → 佩伦**：抓包与说教；佩伦称她为“小骑士”。
- **雪露 → 斯卡摩斯**：邀请他进入队伍。
- **芙勒维拉 → 佩伦**：战斗中为他的偷袭打开缺口。
- **雪露 → 阿瑞尔**：两人来自同一地区，雪露邀请他进入队伍。
- **阿瑞尔 → 雪露**：最先保护、也最信任的人。

## 家庭与旧识

- **梅莉艾尔 → 雪露**：姐姐。
- **梅莉艾尔 ↔ 埃德里克**：姐弟。
- **梅莉艾尔 ↔ 阿尔贝莉娜**：彼此认识。

## 设定关联

- 雪露立誓时见到[[神迹之光]]，并长期持有[[「枝桠」]]。
- 阿尔贝莉娜出生于[[高精灵族群|艾佛瑞斯卡]]，后来离开故乡。
`;

const sourceSpecs: Record<string, SourceSpec> = {
  team: { raw: teamRaw, source: "风芦旅人.md" },
  shirul: { raw: shirulRaw, source: "角色/雪露 Shirul.md" },
  alberina: { raw: alberinaRaw, source: "角色/阿尔贝莉娜 Alberina.md" },
  flavilar: { raw: flavilarRaw, source: "角色/芙勒维拉 Flavilar.md" },
  pheiron: { raw: pheironRaw, source: "角色/佩伦 Pheiron.md" },
  skamos: { raw: skamosRaw, source: "角色/斯卡摩斯 Skamos.md" },
  ariel: { raw: arielRaw, source: "角色/阿瑞尔 Ariel.md" },
  merielle: { raw: merielleRaw, source: "NPC/梅莉艾尔 Merielle.md" },
  oath: { raw: oathRaw, source: "设定/远古誓言.md" },
  "miracle-light": { raw: miracleLightRaw, source: "设定/神迹之光.md" },
  transfiguration: { raw: transfigurationRaw, source: "设定/变形术.md" },
  branch: { raw: branchRaw, source: "道具/「枝桠」.md" },
  neverwinter: { raw: neverwinterRaw, source: "地点/养病的城.md" },
  redlarch: {
    raw: geographyRaw,
    source: "设定/地理.md",
    section: "五人合流地点 · Redlarch",
  },
  "mere-kryptgarden": {
    raw: geographyRaw,
    source: "设定/地理.md",
    section: "芙勒维拉的来处 · 亡者之沼",
  },
  evereska: { raw: evereskaRaw, source: "势力/高精灵族群.md" },
  timeline: { raw: timelineRaw, source: "事件/风芦旅人时间线.md" },
  relationships: { raw: confirmedRelationships, source: "关系网.md" },
};

const targetRoutes = new Map<string, string>();
for (const entry of archiveManifest) {
  const href = archiveHref(entry);
  for (const name of [entry.title, entry.englishTitle, ...entry.aliases]) {
    if (name) targetRoutes.set(name.toLowerCase(), href);
  }
}
targetRoutes.set("风芦旅人", "/");
targetRoutes.set("雪露 shirul", "/archive/characters/shirul");
targetRoutes.set("阿尔贝莉娜 alberina", "/archive/characters/alberina");
targetRoutes.set("芙勒维拉 flavilar", "/archive/characters/flavilar");
targetRoutes.set("佩伦 pheiron", "/archive/characters/pheiron");
targetRoutes.set("斯卡摩斯 skamos", "/archive/characters/skamos");
targetRoutes.set("阿瑞尔 ariel", "/archive/characters/ariel");
targetRoutes.set("梅莉艾尔 merielle", "/archive/characters/merielle");
targetRoutes.set("高精灵族群", "/archive/world/evereska");

const excludedSection = /^(未解|待定|待补|尚未确定|答卷视角)/;
const editorialBlock = [
  /问卷/,
  /2026-\d/,
  /现有资料/,
  /现有档案/,
  /作者/,
  /待跑团/,
  /待补/,
  /待定/,
  /仍待/,
  /尚待/,
  /尚未/,
  /候选/,
  /备选/,
  /提案/,
  /旧档/,
  /没有记录/,
  /没有资料/,
  /资料不足/,
  /未明确/,
  /未有定论/,
  /没有定论/,
  /仍未直接确认/,
  /仍需剧情/,
  /需要单独立页/,
  /逐年资料见/,
  /道路参考/,
  /具体.*没有确定/,
  /银月城/,
];

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "");
}

function selectSection(markdown: string, section?: string) {
  if (!section) return markdown;
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${section}`);
  if (start < 0) return "";
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

function removeExcludedSections(markdown: string) {
  const output: string[] = [];
  let skipLevel = 0;
  for (const line of markdown.split("\n")) {
    const heading = /^(#{2,6})\s+(.+)$/.exec(line.trim());
    if (heading) {
      const level = heading[1].length;
      if (skipLevel && level <= skipLevel) skipLevel = 0;
      if (excludedSection.test(heading[2].trim())) {
        skipLevel = level;
        continue;
      }
    }
    if (!skipLevel) output.push(line);
  }
  return output.join("\n");
}

function normalizePublicNames(markdown: string) {
  return markdown
    .replaceAll("养病的城", "绝冬城")
    .replaceAll("芦溪村", "雪露的故乡")
    .replaceAll("银桦林", "村边林地")
    .replace(/^#\s+.*$/m, "");
}

function removeEditorialBlocks(markdown: string) {
  return markdown
    .split(/\n\s*\n/)
    .filter((block) => !editorialBlock.some((pattern) => pattern.test(block)))
    .join("\n\n");
}

function convertWikiLinks(markdown: string) {
  return markdown.replace(
    /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
    (_match, rawTarget: string, rawLabel?: string) => {
      const target = rawTarget.trim().replace(/\\$/, "");
      const label = (rawLabel ?? target).trim().replace(/\\$/, "");
      const shortTarget = target.split("/").at(-1) ?? target;
      const href =
        targetRoutes.get(target.toLowerCase()) ??
        targetRoutes.get(shortTarget.toLowerCase());
      return href ? `[${label}](${href})` : label;
    },
  );
}

function tidyMarkdown(markdown: string) {
  return markdown
    .replace(/> \[!note\][^\n]*\n(?:>[^\n]*\n?)*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");
}

function sanitizeMarkdown(spec: SourceSpec) {
  let markdown = spec.raw.replaceAll("\r\n", "\n");
  markdown = stripFrontmatter(markdown);
  markdown = selectSection(markdown, spec.section);
  markdown = removeExcludedSections(markdown);
  markdown = normalizePublicNames(markdown);
  markdown = removeEditorialBlocks(markdown);
  markdown = convertWikiLinks(markdown);
  return tidyMarkdown(markdown);
}

export function headingId(title: string) {
  return title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[「」“”‘’（）()·：:，,。.!！?？]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function extractHeadings(markdown: string): ArchiveHeading[] {
  return markdown
    .split("\n")
    .flatMap((line) => {
      const match = /^(##|###)\s+(.+)$/.exec(line.trim());
      if (!match) return [];
      const title = match[2].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      return [
        {
          id: headingId(title),
          level: match[1].length as 2 | 3,
          title,
        },
      ];
    });
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#|\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const archiveEntries: ArchiveEntry[] = archiveManifest.map((manifestEntry) => {
  const spec = sourceSpecs[manifestEntry.sourceId];
  if (!spec) throw new Error(`Missing source for ${manifestEntry.sourceId}`);
  const body = sanitizeMarkdown(spec);
  return {
    ...manifestEntry,
    body,
    headings: extractHeadings(body),
    plainText: markdownToPlainText(body),
    source: spec.source,
  };
});

export const teamOverview = sanitizeMarkdown(sourceSpecs.team);

export function getArchiveEntries() {
  return archiveEntries;
}

export function getArchiveEntry(category: string, slug: string) {
  return archiveEntries.find(
    (entry) => entry.category === category && entry.slug === slug,
  );
}

export function getSearchIndex() {
  return archiveEntries.map((entry) => ({
    title: entry.title,
    englishTitle: entry.englishTitle,
    aliases: entry.aliases,
    category: entry.category,
    summary: entry.summary,
    href: archiveHref(entry),
    text: entry.plainText,
  }));
}

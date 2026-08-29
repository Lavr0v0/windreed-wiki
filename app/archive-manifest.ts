import {
  archiveSectionById,
  type ArchiveCategory,
  type ArchiveSection,
} from "./archive-taxonomy";

export {
  archiveCollections,
  archiveCollectionById,
  archiveSectionById,
  archiveSections,
  isArchiveRouteSegment,
  type ArchiveCategory,
  type ArchiveCollection,
  type ArchiveRouteSegment,
  type ArchiveSection,
} from "./archive-taxonomy";

export type CharacterRole = "member" | "associate";

export type ArchiveManifestEntry = {
  slug: string;
  category: ArchiveCategory;
  section: ArchiveSection;
  title: string;
  englishTitle?: string;
  aliases: string[];
  summary: string;
  monogram: string;
  accent: string;
  characterRole?: CharacterRole;
  personalPage?: string;
  presentation?: "archive" | "glossary";
  facts?: Array<{ label: string; value: string }>;
};

export const categoryLabels: Record<ArchiveCategory, string> = {
  characters: "人物档案",
  world: "世界档案",
  history: "历史档案",
};

export const archiveManifest: ArchiveManifestEntry[] = [
  {
    slug: "shirul",
    category: "characters",
    section: "lives",
    title: "雪露",
    englishTitle: "Shirul",
    aliases: ["雪露", "Shirul", "小骑士"],
    summary: "风芦旅人中最年轻的圣武士，也是最早把同行者称为“我们”的人。",
    monogram: "雪",
    accent: "#78a99a",
    characterRole: "member",
    personalPage: "/characters/shirul/",
    facts: [
      { label: "种族", value: "人类 · 1/8 半身人血统（母系）" },
      { label: "职业", value: "圣武士 · 古贤之誓" },
      { label: "年龄", value: "15 岁" },
      { label: "来处", value: "安柏弗" },
    ],
  },
  {
    slug: "alberina",
    category: "characters",
    section: "lives",
    title: "阿尔贝莉娜",
    englishTitle: "Alberina",
    aliases: ["阿尔贝莉娜", "Alberina", "莉娜"],
    summary: "离开艾弗瑞斯卡的高精灵术士，以知识、判断和长久陪伴支撑队伍。",
    monogram: "莉",
    accent: "#526b91",
    characterRole: "member",
    personalPage: "/characters/alberina/",
    facts: [
      { label: "种族", value: "高精灵" },
      { label: "职业", value: "术士 · 银龙脉" },
      { label: "年龄", value: "约 105 岁" },
      { label: "来处", value: "艾弗瑞斯卡" },
    ],
  },
  {
    slug: "flavilar",
    category: "characters",
    section: "lives",
    title: "芙勒维拉",
    englishTitle: "Flavilar",
    aliases: ["芙勒维拉", "Flavilar"],
    summary: "遭到抹忆与放逐后北上，在无冬森林获救并重新学习语言与规则的黑龙裔战士。",
    monogram: "芙",
    accent: "#58735c",
    characterRole: "member",
    personalPage: "/characters/flavilar/",
    facts: [
      { label: "种族", value: "黑龙裔" },
      { label: "职业", value: "战士 · 战团大师" },
      { label: "年龄", value: "21 岁" },
      { label: "来处", value: "亡者沼泽" },
    ],
  },
  {
    slug: "pheiron",
    category: "characters",
    section: "lives",
    title: "佩伦",
    englishTitle: "Pheiron",
    aliases: ["佩伦", "Pheiron"],
    summary: "礼貌、圆滑又难以捉摸的木精灵刺客，常让队伍的日常多出意外。",
    monogram: "佩",
    accent: "#777d4f",
    characterRole: "member",
    facts: [
      { label: "种族", value: "木精灵" },
      { label: "职业", value: "游荡者 · 刺客" },
      { label: "年龄", value: "131 岁" },
      { label: "来处", value: "木精灵故乡" },
    ],
  },
  {
    slug: "skamos",
    category: "characters",
    section: "lives",
    title: "斯卡摩斯",
    englishTitle: "Skamos",
    aliases: ["斯卡摩斯", "Skamos"],
    summary: "从商队生活走来的提夫林吟游诗人，习惯观察，也擅长支援同伴。",
    monogram: "斯",
    accent: "#7f5962",
    characterRole: "member",
    facts: [
      { label: "种族", value: "提夫林" },
      { label: "职业", value: "吟游诗人 · 勇气学院" },
      { label: "年龄", value: "约 37 岁" },
      { label: "来处", value: "尤拉什" },
    ],
  },
  {
    slug: "ariel",
    category: "characters",
    section: "lives",
    title: "阿瑞尔",
    englishTitle: "Ariel",
    aliases: ["阿瑞尔", "Ariel"],
    summary: "在街头长大的年轻咒术师，以直接而警觉的方式面对威胁。",
    monogram: "瑞",
    accent: "#615a86",
    characterRole: "member",
    facts: [
      { label: "种族", value: "人类" },
      { label: "职业", value: "咒术师" },
      { label: "年龄", value: "18 岁" },
      { label: "来处", value: "安柏弗" },
    ],
  },
  {
    slug: "merielle",
    category: "characters",
    section: "companions",
    title: "梅莉艾尔",
    englishTitle: "Merielle",
    aliases: ["梅莉艾尔", "Merielle"],
    summary: "村长家的长女、雪露的大姐，一位安静而敏锐的非冒险者。",
    monogram: "梅",
    accent: "#a87572",
    characterRole: "associate",
    facts: [
      { label: "种族", value: "人类" },
      { label: "身份", value: "非冒险者" },
      { label: "年龄", value: "26 岁" },
      { label: "来处", value: "安柏弗" },
    ],
  },
  {
    slug: "oath-of-the-ancients",
    category: "world",
    section: "lore",
    title: "古贤之誓",
    englishTitle: "Oath of the Ancients",
    aliases: ["古贤之誓", "远古誓言", "远古之誓", "上古之誓", "Oath of the Ancients"],
    summary: "雪露在无冬森林为救芙勒维拉立下的圣武士誓言，以守护生命、光与希望为核心。",
    monogram: "誓",
    accent: "#7b9367",
    presentation: "glossary",
  },
  {
    slug: "miracle-light",
    category: "world",
    section: "lore",
    title: "神迹之光",
    aliases: ["神迹之光", "光"],
    summary: "雪露立誓后出现的局部神迹：芙勒维拉的伤势暂时稳住，近处少量草木抽出新芽。",
    monogram: "光",
    accent: "#b59a56",
  },
  {
    slug: "transfiguration",
    category: "world",
    section: "lore",
    title: "变身术",
    englishTitle: "Alter Self",
    aliases: ["变身术", "变形术", "Alter Self", "外形变化法术"],
    summary: "阿尔贝莉娜掌握的二环变化系法术，只能暂时改变施法者自身。",
    monogram: "变",
    accent: "#6b7f9c",
  },
  {
    slug: "branch",
    category: "world",
    section: "relics",
    title: "「枝桠」",
    aliases: ["枝桠", "「枝桠」", "Branch"],
    summary: "雪露长期使用的大型双手长剑，也是她珍视的随身之物。",
    monogram: "枝",
    accent: "#8d8156",
  },
  {
    slug: "flas-mishy-choker",
    category: "world",
    section: "relics",
    title: "小拉的咪西颈环",
    englishTitle: "Fla's mishy choker",
    aliases: [
      "小拉的咪西颈环",
      "Fla's mishy choker",
      "Fla's Mishy Choker",
      "旅人颈环",
      "易貌颈环",
      "Traveler's Choker",
      "储法戒指",
    ],
    summary: "阿尔贝莉娜随口起了个怪名字的艾弗瑞斯卡易貌颈环，如今大多戴在芙勒维拉颈间。",
    monogram: "M",
    accent: "#78859c",
    presentation: "glossary",
  },
  {
    slug: "emberford",
    category: "world",
    section: "places",
    title: "安柏弗",
    englishTitle: "Emberford",
    aliases: ["安柏弗", "Emberford", "雪露的故乡"],
    summary: "无冬森林东缘一座常年萦绕着泉雾的小村庄，村中的 Sune 教堂陪伴雪露长大。",
    monogram: "安",
    accent: "#a06f4f",
    presentation: "glossary",
  },
  {
    slug: "neverwinter",
    category: "world",
    section: "places",
    title: "无冬城",
    englishTitle: "Neverwinter",
    aliases: ["无冬城", "绝冬城", "Neverwinter"],
    summary: "气候温暖、医师与圣堂集中的城市，梅莉艾尔常在此接受照料。",
    monogram: "冬",
    accent: "#6d8798",
    presentation: "glossary",
  },
  {
    slug: "redlarch",
    category: "world",
    section: "places",
    title: "红松镇",
    englishTitle: "Red Larch",
    aliases: ["红松镇", "Red Larch", "Redlarch"],
    summary: "德沙林河谷长路沿线的商队小镇，早期五人在这里合流。",
    monogram: "R",
    accent: "#9a6c52",
    presentation: "glossary",
  },
  {
    slug: "mere-kryptgarden",
    category: "world",
    section: "places",
    title: "亡者沼泽与无冬森林",
    englishTitle: "Mere of Dead Men · Neverwinter Wood",
    aliases: ["亡者沼泽", "亡者之沼", "无冬森林", "绝冬林", "Mere of Dead Men", "Neverwinter Wood"],
    summary: "芙勒维拉在亡者沼泽出生并遭放逐，北上后藏身无冬森林，最终在那里获救。",
    monogram: "沼",
    accent: "#4f6b5d",
    presentation: "glossary",
  },
  {
    slug: "evereska",
    category: "world",
    section: "places",
    title: "艾弗瑞斯卡",
    englishTitle: "Evereska",
    aliases: ["艾弗瑞斯卡", "埃弗瑞斯卡", "艾佛瑞斯卡", "Evereska", "高精灵族群"],
    summary: "位于灰斗篷丘陵一带、受魔法保护的隐秘精灵城邦，也是阿尔贝莉娜的故乡。",
    monogram: "艾",
    accent: "#657a9b",
    presentation: "glossary",
  },
  {
    slug: "alberina-biography",
    category: "history",
    section: "fortunes",
    title: "银鳞落在书页之外",
    englishTitle: "Alberina · A Life Beyond the Pages",
    aliases: ["阿尔贝莉娜 Alberina · 人物传记", "阿尔贝莉娜人物传记", "阿尔贝莉娜传记", "Alberina Biography"],
    summary: "从艾弗瑞斯卡的童年，到安柏弗与风芦旅人的长路。",
    monogram: "莉",
    accent: "#526b91",
  },
  {
    slug: "timeline",
    category: "history",
    section: "chronicle",
    title: "队伍时间线",
    aliases: ["时间线", "风芦旅人时间线", "1492 DR"],
    summary: "按纪年和合流顺序整理的队伍主要经历。",
    monogram: "年",
    accent: "#8f7d55",
  },
  {
    slug: "relationships",
    category: "history",
    section: "lives",
    title: "关系档案",
    aliases: ["关系档案", "关系网", "人际关系"],
    summary: "六名正式成员、梅莉艾尔与核心设定之间已经确认的联系。",
    monogram: "结",
    accent: "#7c6f78",
  },
];

const configuredBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH?.replace(/\/$/, "") ?? "";

export function siteHref(path: string) {
  if (!path.startsWith("/")) return path;
  if (!configuredBasePath) return path;
  return path === "/" ? `${configuredBasePath}/` : `${configuredBasePath}${path}`;
}

export function archivePath(entry: Pick<ArchiveManifestEntry, "section" | "slug">) {
  return `/archive/${entry.section}/${entry.slug}`;
}

export function archiveHref(entry: Pick<ArchiveManifestEntry, "section" | "slug">) {
  return siteHref(archivePath(entry));
}

export function legacyArchivePath(entry: Pick<ArchiveManifestEntry, "category" | "slug">) {
  return `/archive/${entry.category}/${entry.slug}`;
}

export function legacyArchiveHref(entry: Pick<ArchiveManifestEntry, "category" | "slug">) {
  return siteHref(legacyArchivePath(entry));
}

const canonicalArchiveOrder = new Map(
  archiveManifest.map((entry, index) => [entry.slug, index]),
);

export function sortArchiveEntries<T extends Pick<ArchiveManifestEntry, "slug">>(
  entries: readonly T[],
) {
  return [...entries].sort((left, right) => {
    const leftIndex = canonicalArchiveOrder.get(left.slug);
    const rightIndex = canonicalArchiveOrder.get(right.slug);
    return (leftIndex ?? Number.MAX_SAFE_INTEGER) - (rightIndex ?? Number.MAX_SAFE_INTEGER);
  });
}

const canonicalArchivePathByLegacyPath = new Map(
  archiveManifest.map((entry) => [legacyArchivePath(entry), archivePath(entry)]),
);
const legacyArchivePathPattern = /\/archive\/(?:characters|world|history)\/[a-z0-9-]+/g;

export function canonicalizeArchiveLinks(value: string) {
  return value.replace(
    legacyArchivePathPattern,
    (path) => canonicalArchivePathByLegacyPath.get(path) ?? path,
  );
}

export type RouteSearchParams = Record<string, string | string[] | undefined>;

export function appendSearchParams(href: string, values: RouteSearchParams) {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) searchParams.append(name, item);
    } else if (value !== undefined) {
      searchParams.append(name, value);
    }
  }
  const query = searchParams.toString();
  return query ? `${href}?${query}` : href;
}

export function entriesByCategory(category: ArchiveCategory) {
  return archiveManifest.filter((entry) => entry.category === category);
}

export function navigationEntriesByCategory(category: ArchiveCategory) {
  return archiveManifest.filter(
    (entry) => entry.category === category && entry.presentation !== "glossary",
  );
}

export function entriesBySection(section: ArchiveSection) {
  return archiveManifest.filter((entry) => entry.section === section);
}

export function partyMemberEntries() {
  return archiveManifest.filter((entry) => entry.characterRole === "member");
}

export function memberFolioNumber(slug: string) {
  const index = partyMemberEntries().findIndex((entry) => entry.slug === slug);
  return index < 0 ? null : index + 1;
}

export function associateEntries() {
  return archiveManifest.filter((entry) => entry.characterRole === "associate");
}

export function entryCollectionLabel(entry: Pick<ArchiveManifestEntry, "section">) {
  return archiveSectionById[entry.section].chinese;
}

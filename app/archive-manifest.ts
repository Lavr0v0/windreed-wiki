export type ArchiveCategory = "characters" | "world" | "history";
export type CharacterRole = "member" | "associate";
export type ArchiveCollection = "archives" | "stories";
export type ArchiveSection =
  | "lives"
  | "companions"
  | "places"
  | "relics"
  | "lore"
  | "heraldry"
  | "tales"
  | "chronicle"
  | "fortunes";

export type ArchiveManifestEntry = {
  slug: string;
  category: ArchiveCategory;
  section: ArchiveSection;
  title: string;
  englishTitle?: string;
  aliases: string[];
  summary: string;
  sourceId: string;
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

export const archiveCollections: Array<{
  id: ArchiveCollection;
  english: "ARCHIVES" | "STORIES";
  chinese: string;
}> = [
  { id: "archives", english: "ARCHIVES", chinese: "档案组" },
  { id: "stories", english: "STORIES", chinese: "故事组" },
];

export const archiveSections: Array<{
  id: ArchiveSection;
  collection: ArchiveCollection;
  english: string;
  chinese: string;
  description: string;
}> = [
  { id: "lives", collection: "archives", english: "LIVES", chinese: "卷中人", description: "角色档案；每位角色各有一篇完整故事。" },
  { id: "companions", collection: "archives", english: "COMPANIONS", chinese: "同行者", description: "与风芦旅人同行的伙伴。" },
  { id: "places", collection: "archives", english: "PLACES", chinese: "风物", description: "村庄、城市、森林与旅途中经过的地方。" },
  { id: "relics", collection: "archives", english: "RELICS", chinese: "行囊", description: "有来历、值得收存的物品与信物。" },
  { id: "lore", collection: "archives", english: "LORE", chinese: "见闻", description: "神迹、誓言、血脉与法术等见闻。" },
  { id: "heraldry", collection: "archives", english: "HERALDRY", chinese: "纹章", description: "教会、族群与组织的纹章记录。" },
  { id: "tales", collection: "stories", english: "TALES", chinese: "逸闻", description: "旅途中散落的短篇与片段。" },
  { id: "chronicle", collection: "stories", english: "THE CHRONICLE", chinese: "长路", description: "风芦旅人共同经历的主线编年史。" },
  { id: "fortunes", collection: "stories", english: "FORTUNES", chinese: "际遇", description: "个人际遇、转折与命运的遭逢。" },
];

export const archiveSectionById = Object.fromEntries(
  archiveSections.map((section) => [section.id, section]),
) as Record<ArchiveSection, (typeof archiveSections)[number]>;

export const archiveManifest: ArchiveManifestEntry[] = [
  {
    slug: "shirul",
    category: "characters",
    section: "lives",
    title: "雪露",
    englishTitle: "Shirul",
    aliases: ["雪露", "Shirul", "小骑士"],
    summary: "风芦旅人中最年轻的圣武士，也是最早把同行者称为“我们”的人。",
    sourceId: "shirul",
    monogram: "雪",
    accent: "#78a99a",
    characterRole: "member",
    personalPage: "/DnD/Shirul/",
    facts: [
      { label: "种族", value: "人类" },
      { label: "职业", value: "圣武士 · 古贤之誓" },
      { label: "年龄", value: "15 岁" },
      { label: "定位", value: "情感核心" },
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
    sourceId: "alberina",
    monogram: "莉",
    accent: "#526b91",
    characterRole: "member",
    personalPage: "/DnD/Alberina/",
    facts: [
      { label: "种族", value: "高精灵" },
      { label: "职业", value: "术士 · 银龙脉" },
      { label: "年龄", value: "约 105 岁" },
      { label: "定位", value: "知识支点" },
    ],
  },
  {
    slug: "flavilar",
    category: "characters",
    section: "lives",
    title: "芙勒维拉",
    englishTitle: "Flavilar",
    aliases: ["芙勒维拉", "Flavilar"],
    summary: "失去记忆后重新学习语言、规则与归属的黑龙裔战士。",
    sourceId: "flavilar",
    monogram: "芙",
    accent: "#58735c",
    characterRole: "member",
    personalPage: "/DnD/Flavilar/",
    facts: [
      { label: "种族", value: "黑龙裔" },
      { label: "职业", value: "战士 · 战团大师" },
      { label: "年龄", value: "21 岁" },
      { label: "定位", value: "重建认知者" },
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
    sourceId: "pheiron",
    monogram: "佩",
    accent: "#777d4f",
    characterRole: "member",
    facts: [
      { label: "种族", value: "木精灵" },
      { label: "职业", value: "游荡者 · 刺客" },
      { label: "年龄", value: "131 岁" },
      { label: "定位", value: "队伍的变数" },
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
    sourceId: "skamos",
    monogram: "斯",
    accent: "#7f5962",
    characterRole: "member",
    facts: [
      { label: "种族", value: "提夫林" },
      { label: "职业", value: "吟游诗人 · 勇气学院" },
      { label: "年龄", value: "约 37 岁" },
      { label: "定位", value: "观察者" },
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
    sourceId: "ariel",
    monogram: "瑞",
    accent: "#615a86",
    characterRole: "member",
    facts: [
      { label: "种族", value: "人类" },
      { label: "职业", value: "咒术师" },
      { label: "年龄", value: "18 岁" },
      { label: "定位", value: "队伍的锋刃" },
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
    sourceId: "merielle",
    monogram: "梅",
    accent: "#a87572",
    characterRole: "associate",
    facts: [
      { label: "种族", value: "人类" },
      { label: "身份", value: "非冒险者" },
      { label: "年龄", value: "26 岁" },
      { label: "所属", value: "村长家" },
    ],
  },
  {
    slug: "oath-of-the-ancients",
    category: "world",
    section: "lore",
    title: "古贤之誓",
    englishTitle: "Oath of the Ancients",
    aliases: ["古贤之誓", "远古誓言", "远古之誓", "上古之誓", "Oath of the Ancients"],
    summary: "雪露所立下的圣武士誓言，以守护生命、光与希望为核心。",
    sourceId: "oath",
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
    summary: "约 1490 DR 落下并令万物迅速生长的一束光，雪露由此立誓。",
    sourceId: "miracle-light",
    monogram: "光",
    accent: "#b59a56",
  },
  {
    slug: "transfiguration",
    category: "world",
    section: "lore",
    title: "变形术",
    aliases: ["变形术", "外形变化法术"],
    summary: "阿尔贝莉娜用来遮掩芙勒维拉龙裔外貌的变化法术。",
    sourceId: "transfiguration",
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
    sourceId: "branch",
    monogram: "枝",
    accent: "#8d8156",
  },
  {
    slug: "emberford",
    category: "world",
    section: "places",
    title: "安柏弗",
    englishTitle: "Emberford",
    aliases: ["安柏弗", "Emberford", "雪露的故乡"],
    summary: "位于无冬森林东缘的温泉村庄，雪露出生并长大的故乡。",
    sourceId: "emberford",
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
    sourceId: "neverwinter",
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
    sourceId: "redlarch",
    monogram: "R",
    accent: "#9a6c52",
    presentation: "glossary",
  },
  {
    slug: "mere-kryptgarden",
    category: "world",
    section: "places",
    title: "亡者沼泽与墓园森林",
    englishTitle: "Mere of Dead Men · Kryptgarden Forest",
    aliases: ["亡者沼泽", "亡者之沼", "墓园森林", "Mere of Dead Men", "Kryptgarden Forest"],
    summary: "芙勒维拉的出生地、放逐之地与重新被同伴找到的区域。",
    sourceId: "mere-kryptgarden",
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
    summary: "阿尔贝莉娜出生和接受完整教育的精灵城市。",
    sourceId: "evereska",
    monogram: "艾",
    accent: "#657a9b",
    presentation: "glossary",
  },
  {
    slug: "timeline",
    category: "history",
    section: "chronicle",
    title: "队伍时间线",
    aliases: ["时间线", "风芦旅人时间线", "1492 DR"],
    summary: "按纪年和合流顺序整理的队伍主要经历。",
    sourceId: "timeline",
    monogram: "年",
    accent: "#8f7d55",
  },
  {
    slug: "relationships",
    category: "history",
    section: "fortunes",
    title: "关系档案",
    aliases: ["关系档案", "关系网", "人际关系"],
    summary: "六名正式成员、梅莉艾尔与核心设定之间已经确认的联系。",
    sourceId: "relationships",
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

export function archiveHref(entry: Pick<ArchiveManifestEntry, "category" | "slug">) {
  return siteHref(`/archive/${entry.category}/${entry.slug}`);
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

export function associateEntries() {
  return archiveManifest.filter((entry) => entry.characterRole === "associate");
}

export function entryCollectionLabel(entry: Pick<ArchiveManifestEntry, "section">) {
  return archiveSectionById[entry.section].chinese;
}

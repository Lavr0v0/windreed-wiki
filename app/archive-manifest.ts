export type ArchiveCategory = "characters" | "world" | "history";

export type ArchiveManifestEntry = {
  slug: string;
  category: ArchiveCategory;
  title: string;
  englishTitle?: string;
  aliases: string[];
  summary: string;
  sourceId: string;
  monogram: string;
  accent: string;
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
    title: "雪露",
    englishTitle: "Shirul",
    aliases: ["雪露", "Shirul", "小骑士"],
    summary: "风芦旅人中最年轻的圣武士，也是最早把同行者称为“我们”的人。",
    sourceId: "shirul",
    monogram: "雪",
    accent: "#78a99a",
    facts: [
      { label: "种族", value: "人类" },
      { label: "职业", value: "圣武士 · 上古之誓" },
      { label: "年龄", value: "15 岁" },
      { label: "定位", value: "情感核心" },
    ],
  },
  {
    slug: "alberina",
    category: "characters",
    title: "阿尔贝莉娜",
    englishTitle: "Alberina",
    aliases: ["阿尔贝莉娜", "Alberina", "莉娜"],
    summary: "离开艾佛瑞斯卡的高精灵术士，以知识、判断和长久陪伴支撑队伍。",
    sourceId: "alberina",
    monogram: "莉",
    accent: "#526b91",
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
    title: "芙勒维拉",
    englishTitle: "Flavilar",
    aliases: ["芙勒维拉", "Flavilar"],
    summary: "失去记忆后重新学习语言、规则与归属的黑龙裔战士。",
    sourceId: "flavilar",
    monogram: "芙",
    accent: "#58735c",
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
    title: "佩伦",
    englishTitle: "Pheiron",
    aliases: ["佩伦", "Pheiron"],
    summary: "礼貌、圆滑又难以捉摸的木精灵刺客，常让队伍的日常多出意外。",
    sourceId: "pheiron",
    monogram: "佩",
    accent: "#777d4f",
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
    title: "斯卡摩斯",
    englishTitle: "Skamos",
    aliases: ["斯卡摩斯", "Skamos"],
    summary: "从商队生活走来的提夫林吟游诗人，习惯观察，也擅长支援同伴。",
    sourceId: "skamos",
    monogram: "斯",
    accent: "#7f5962",
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
    title: "阿瑞尔",
    englishTitle: "Ariel",
    aliases: ["阿瑞尔", "Ariel"],
    summary: "在街头长大的年轻咒术师，以直接而警觉的方式面对威胁。",
    sourceId: "ariel",
    monogram: "瑞",
    accent: "#615a86",
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
    title: "梅莉艾尔",
    englishTitle: "Merielle",
    aliases: ["梅莉艾尔", "Merielle"],
    summary: "村长家的长女、雪露的大姐，一位安静而敏锐的非冒险者。",
    sourceId: "merielle",
    monogram: "梅",
    accent: "#a87572",
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
    title: "远古誓言",
    englishTitle: "Oath of the Ancients",
    aliases: ["远古誓言", "上古之誓", "Oath of the Ancients"],
    summary: "雪露所立下的圣武士誓言，以守护生命、光与希望为核心。",
    sourceId: "oath",
    monogram: "誓",
    accent: "#7b9367",
  },
  {
    slug: "miracle-light",
    category: "world",
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
    title: "安柏弗",
    englishTitle: "Emberford",
    aliases: ["安柏弗", "Emberford", "雪露的故乡"],
    summary: "位于绝冬林东缘的温泉村庄，雪露出生并长大的故乡。",
    sourceId: "emberford",
    monogram: "安",
    accent: "#a06f4f",
  },
  {
    slug: "neverwinter",
    category: "world",
    title: "绝冬城",
    englishTitle: "Neverwinter",
    aliases: ["绝冬城", "Neverwinter"],
    summary: "气候温暖、医师与圣堂集中的城市，梅莉艾尔常在此接受照料。",
    sourceId: "neverwinter",
    monogram: "冬",
    accent: "#6d8798",
  },
  {
    slug: "redlarch",
    category: "world",
    title: "Redlarch",
    aliases: ["Redlarch", "红松镇"],
    summary: "德萨林河谷长路沿线的商队小镇，早期五人在这里合流。",
    sourceId: "redlarch",
    monogram: "R",
    accent: "#9a6c52",
  },
  {
    slug: "mere-kryptgarden",
    category: "world",
    title: "亡者之沼与墓园森林",
    englishTitle: "Mere of Dead Men · Kryptgarden Forest",
    aliases: ["亡者之沼", "墓园森林", "Mere of Dead Men", "Kryptgarden Forest"],
    summary: "芙勒维拉的出生地、放逐之地与重新被同伴找到的区域。",
    sourceId: "mere-kryptgarden",
    monogram: "沼",
    accent: "#4f6b5d",
  },
  {
    slug: "evereska",
    category: "world",
    title: "艾佛瑞斯卡",
    englishTitle: "Evereska",
    aliases: ["艾佛瑞斯卡", "Evereska", "高精灵族群"],
    summary: "阿尔贝莉娜出生和接受完整教育的精灵城市。",
    sourceId: "evereska",
    monogram: "艾",
    accent: "#657a9b",
  },
  {
    slug: "timeline",
    category: "history",
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
    title: "关系档案",
    aliases: ["关系档案", "关系网", "人际关系"],
    summary: "六名正式成员、梅莉艾尔与核心设定之间已经确认的联系。",
    sourceId: "relationships",
    monogram: "结",
    accent: "#7c6f78",
  },
];

export function archiveHref(entry: Pick<ArchiveManifestEntry, "category" | "slug">) {
  return `/archive/${entry.category}/${entry.slug}`;
}

export function entriesByCategory(category: ArchiveCategory) {
  return archiveManifest.filter((entry) => entry.category === category);
}

export type ArchiveCategory = "characters" | "world" | "history";
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

export const archiveCollections = [
  { id: "archives", english: "ARCHIVES", chinese: "档案组", directory: "档案组" },
  { id: "stories", english: "STORIES", chinese: "故事组", directory: "故事组" },
] as const satisfies ReadonlyArray<{
  id: ArchiveCollection;
  english: "ARCHIVES" | "STORIES";
  chinese: string;
  directory: string;
}>;

export const archiveSections = [
  {
    id: "lives",
    collection: "archives",
    category: "characters",
    english: "LIVES",
    chinese: "卷中人",
    directory: "卷中人",
    description: "角色档案；每位角色各有一篇完整故事。",
  },
  {
    id: "companions",
    collection: "archives",
    category: "characters",
    english: "COMPANIONS",
    chinese: "同行者",
    directory: "同行者",
    description: "与风芦旅人同行的伙伴。",
  },
  {
    id: "places",
    collection: "archives",
    category: "world",
    english: "PLACES",
    chinese: "风物",
    directory: "风物",
    description: "村庄、城市、森林与旅途中经过的地方。",
  },
  {
    id: "relics",
    collection: "archives",
    category: "world",
    english: "RELICS",
    chinese: "行囊",
    directory: "行囊",
    description: "有来历、值得收存的物品与信物。",
  },
  {
    id: "lore",
    collection: "archives",
    category: "world",
    english: "LORE",
    chinese: "见闻",
    directory: "见闻",
    description: "神迹、誓言、血脉与法术等见闻。",
  },
  {
    id: "heraldry",
    collection: "archives",
    category: "world",
    english: "HERALDRY",
    chinese: "纹章",
    directory: "纹章",
    description: "教会、族群与组织的纹章记录。",
  },
  {
    id: "tales",
    collection: "stories",
    category: "history",
    english: "TALES",
    chinese: "逸闻",
    directory: "逸闻",
    description: "不承担主线或个人线推进、可以独立阅读的短篇与片段。",
  },
  {
    id: "chronicle",
    collection: "stories",
    category: "history",
    english: "THE CHRONICLE",
    chinese: "长路",
    directory: "长路",
    description: "风芦旅人共同经历的主线编年史。",
  },
  {
    id: "fortunes",
    collection: "stories",
    category: "history",
    english: "FORTUNES",
    chinese: "际遇",
    directory: "际遇",
    description: "个人线、支线任务与改变命运的遭逢和转折。",
  },
] as const satisfies ReadonlyArray<{
  id: ArchiveSection;
  collection: ArchiveCollection;
  category: ArchiveCategory;
  english: string;
  chinese: string;
  directory: string;
  description: string;
}>;

export const archiveCollectionById = Object.fromEntries(
  archiveCollections.map((collection) => [collection.id, collection]),
) as Record<ArchiveCollection, (typeof archiveCollections)[number]>;

export const archiveSectionById = Object.fromEntries(
  archiveSections.map((section) => [section.id, section]),
) as Record<ArchiveSection, (typeof archiveSections)[number]>;

export function archiveSectionDirectory(section: ArchiveSection) {
  const definition = archiveSectionById[section];
  const collection = archiveCollectionById[definition.collection];
  return `${collection.directory}/${definition.directory}`;
}

export const editorEntrySections = archiveSections.map((section) => ({
  value: section.id,
  label: `${section.english} · ${section.chinese}`,
  category: section.category,
  directory: archiveSectionDirectory(section.id),
}));

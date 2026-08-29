import {
  archiveManifest,
  type ArchiveManifestEntry,
  type ArchiveSection,
} from "./archive-manifest";

const englishNavigationTitles: Record<string, string> = {
  shirul: "Shirul",
  alberina: "Alberina",
  flavilar: "Flavilar",
  pheiron: "Pheiron",
  skamos: "Skamos",
  ariel: "Ariel",
  merielle: "Merielle",
  "oath-of-the-ancients": "Oath of the Ancients",
  "miracle-light": "The Miracle Light",
  transfiguration: "Alter Self",
  branch: "Branch",
  "flas-mishy-choker": "Fla’s Mishy Choker",
  emberford: "Emberford",
  neverwinter: "Neverwinter",
  redlarch: "Red Larch",
  "mere-kryptgarden": "The Mere of Dead Men and Neverwinter Wood",
  evereska: "Evereska",
  "alberina-biography": "Alberina · A Life Beyond the Pages",
  timeline: "Company Timeline",
  relationships: "Relationship Ledger",
};

export const englishNavigationManifest: ArchiveManifestEntry[] = archiveManifest.map((entry) => {
  const title = englishNavigationTitles[entry.slug];
  if (!title) throw new Error(`Missing English navigation title for ${entry.slug}`);
  return {
    ...entry,
    aliases: [],
    englishTitle: undefined,
    facts: undefined,
    personalPage: undefined,
    summary: "",
    title,
  };
});

export const englishSections: Record<
  ArchiveSection,
  { title: string; description: string }
> = {
  lives: {
    title: "Lives",
    description: "Complete profiles of the people whose paths make up the company.",
  },
  companions: {
    title: "Companions",
    description: "People closely connected to the Wayfarers beyond the six core members.",
  },
  places: {
    title: "Places",
    description: "Villages, cities, forests, and waypoints along the road.",
  },
  relics: {
    title: "Relics",
    description: "Weapons, keepsakes, and enchanted objects with a history of their own.",
  },
  lore: {
    title: "Lore",
    description: "Oaths, miracles, bloodlines, and magic encountered along the way.",
  },
  heraldry: {
    title: "Heraldry",
    description: "Recorded emblems of churches, peoples, and organizations.",
  },
  tales: {
    title: "Tales",
    description: "Short pieces and self-contained moments away from the main chronicle.",
  },
  chronicle: {
    title: "The Chronicle",
    description: "The shared road of the Windreed Wayfarers, arranged in time.",
  },
  fortunes: {
    title: "Fortunes",
    description: "Personal histories, side roads, and encounters that changed a life.",
  },
};

export function englishArchiveHref(entry: Pick<ArchiveManifestEntry, "section" | "slug">) {
  return `/en/archive/${entry.section}/${entry.slug}`;
}

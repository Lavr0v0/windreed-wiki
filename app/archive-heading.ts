export type ArchiveHeading = {
  id: string;
  level: 2 | 3;
  title: string;
};

export function headingId(title: string) {
  return title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[「」“”‘’（）()·：:，,。.!！?？]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

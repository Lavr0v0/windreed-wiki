import type { Metadata } from "next";
import { getSearchIndex } from "../archive-content.server";
import type { ArchiveCategory } from "../archive-manifest";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "全文索引",
  description: "检索 The Windreed Wayfarers 公开档案。",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const category = ["characters", "world", "history"].includes(params.category ?? "")
    ? (params.category as ArchiveCategory)
    : undefined;
  return (
    <SearchClient
      index={getSearchIndex()}
      initialQuery={params.q ?? ""}
      initialCategory={category}
    />
  );
}

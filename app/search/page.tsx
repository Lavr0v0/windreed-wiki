import type { Metadata } from "next";
import { getPublicSearchIndex } from "../public-archive.server";
import { SearchClient } from "./SearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "全文索引",
  description: "检索 The Windreed Wayfarers 公开档案。",
};

export default async function SearchPage() {
  return <SearchClient index={await getPublicSearchIndex()} />;
}

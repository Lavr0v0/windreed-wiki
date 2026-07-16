import type { Metadata } from "next";
import { getSearchIndex } from "../archive-content.server";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "全文索引",
  description: "检索 The Windreed Wayfarers 公开档案。",
};

export default function SearchPage() {
  return <SearchClient index={getSearchIndex()} />;
}

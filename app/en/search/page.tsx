import type { Metadata } from "next";
import { SearchClient } from "../../search/SearchClient";
import { getEnglishSearchIndex } from "../../english-content";

export const metadata: Metadata = {
  title: "Full Archive Index",
  description: "Search the English public archive of the Windreed Wayfarers.",
};

export default function EnglishSearchPage() {
  return <SearchClient index={getEnglishSearchIndex()} locale="en" />;
}

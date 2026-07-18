import { listPublishedEntries } from "@/app/editor/lib/repository.server";
import { jsonError } from "@/app/editor/lib/server";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim().toLocaleLowerCase("zh-CN") ?? "";
    const entries = await listPublishedEntries();
    const results = query
      ? entries.filter((entry) => [
          entry.payload.title,
          entry.payload.englishTitle,
          entry.payload.aliases.join(" "),
          entry.payload.summary,
          entry.plainText,
        ].join(" ").toLocaleLowerCase("zh-CN").includes(query))
      : entries;
    return Response.json(
      { query, results: results.slice(0, 100) },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

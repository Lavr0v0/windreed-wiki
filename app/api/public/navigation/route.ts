import { getPublicArchiveNavigationEntries } from "@/app/public-archive.server";

export async function GET() {
  return Response.json(
    { entries: await getPublicArchiveNavigationEntries() },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}

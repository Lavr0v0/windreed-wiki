import { listPublishedEntries } from "@/app/editor/lib/repository.server";
import { jsonError } from "@/app/editor/lib/server";

export async function GET() {
  try {
    return Response.json(
      { entries: await listPublishedEntries() },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

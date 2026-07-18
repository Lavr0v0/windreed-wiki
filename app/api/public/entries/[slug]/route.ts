import { getPublishedEntry } from "@/app/editor/lib/repository.server";
import { jsonError } from "@/app/editor/lib/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const entry = await getPublishedEntry(slug);
    if (!entry) return Response.json({ error: "没有找到这个公开词条。" }, { status: 404 });
    return Response.json(
      { entry },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

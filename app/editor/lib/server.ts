import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb, getRuntimeEnv } from "@/db";
import { editors } from "@/db/schema";
import type { EditorIdentity, EditorRole } from "./types";

const TRUSTED_EMAIL_HEADER = "x-windreed-editor-email";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

function normalizedEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function configuredAdmins() {
  return new Set(
    (getRuntimeEnv().WINDREED_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => normalizedEmail(email))
      .filter(Boolean),
  );
}

export async function requireEditorIdentity(): Promise<EditorIdentity> {
  const requestHeaders = await headers();
  const email = normalizedEmail(requestHeaders.get(TRUSTED_EMAIL_HEADER));
  if (!email) throw new ApiError(401, "登录信息无效，请从编辑站重新进入。");

  if (requestHeaders.get("x-windreed-editor-local") === "1") {
    return { email, displayName: "本地管理员", role: "admin" };
  }

  if (configuredAdmins().has(email)) {
    return { email, displayName: email.split("@")[0], role: "admin" };
  }

  const [account] = await getDb()
    .select()
    .from(editors)
    .where(and(eq(editors.email, email), eq(editors.active, true)))
    .limit(1);

  if (!account) throw new ApiError(403, "这个邮箱尚未被加入风芦档案的协作者名单。");
  return {
    email,
    displayName: account.displayName?.trim() || email.split("@")[0],
    role: account.role as EditorRole,
  };
}

export function requireAdmin(identity: EditorIdentity) {
  if (identity.role !== "admin") throw new ApiError(403, "只有管理员可以进行这项操作。");
}

export async function assertEditorRequest() {
  const requestHeaders = await headers();
  if (requestHeaders.get("x-windreed-editor") !== "1") {
    throw new ApiError(400, "请求缺少编辑器标记。");
  }

  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (origin && host) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new ApiError(400, "请求来源无效。");
    }
    if (originHost !== host) throw new ApiError(403, "拒绝来自其他网站的编辑请求。");
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, details: error.details ?? null },
      { status: error.status },
    );
  }
  console.error(error);
  return Response.json({ error: "服务器暂时无法完成这项操作。" }, { status: 500 });
}

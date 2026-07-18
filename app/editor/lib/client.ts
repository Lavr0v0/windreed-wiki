"use client";

export class EditorApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function editorApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET") headers.set("x-windreed-editor", "1");
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as {
    error?: string;
    details?: unknown;
  };
  if (!response.ok) {
    throw new EditorApiError(data.error || "请求失败。", response.status, data.details);
  }
  return data as T;
}

export function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return "发生了未知错误。";
  if (error instanceof EditorApiError && error.details && typeof error.details === "object") {
    const issues = (error.details as { issues?: unknown }).issues;
    if (Array.isArray(issues)) return `${error.message}\n${issues.join("\n")}`;
  }
  return error.message;
}

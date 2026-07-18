/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { verifiedAccessEmail, type AccessEnv } from "./access";
import { setRuntimeEnv } from "../db";

interface Env extends AccessEnv {
  ASSETS: Fetcher;
  DB: D1Database;
  PUBLIC_ARCHIVE_CACHE?: KVNamespace;
  WINDREED_ADMIN_EMAILS?: string;
  WINDREED_EDITOR_HOST?: string;
  WINDREED_LOCAL_ADMIN_EMAIL?: string;
  WINDREED_PUBLIC_DOMAIN_ENABLED?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const publicCacheVaryHeaders = [
  "accept",
  "rsc",
  "next-router-state-tree",
  "next-router-prefetch",
  "next-router-segment-prefetch",
  "next-url",
  "x-vinext-interception-context",
  "x-vinext-mounted-slots",
  "x-vinext-rsc-render-mode",
] as const;

function isPublicCacheableRequest(request: Request, url: URL, editorHost: string) {
  if (request.method !== "GET" || url.hostname.toLowerCase() === editorHost) return false;
  return url.pathname === "/"
    || url.pathname === "/search"
    || url.pathname.startsWith("/archive/")
    || url.pathname.startsWith("/api/public/");
}

async function publicCacheKey(request: Request) {
  const variant = publicCacheVaryHeaders
    .map((name) => `${name}:${request.headers.get(name) ?? ""}`)
    .join("\n");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(variant));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const cacheUrl = new URL(request.url);
  cacheUrl.searchParams.set("__windreed_variant", hash.slice(0, 24));
  return new Request(cacheUrl, { method: "GET" });
}

function publicCacheResponse(response: Response, status: "HIT" | "MISS") {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=45, stale-while-revalidate=300");
  headers.set("X-Windreed-Cache", status);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function defaultWorkerCache() {
  try {
    return (globalThis.caches as (CacheStorage & { default?: Cache }) | undefined)?.default ?? null;
  } catch {
    return null;
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env = {} as Env, ctx: ExecutionContext): Promise<Response> {
    setRuntimeEnv(env);
    const url = new URL(request.url);
    const editorHost = (env.WINDREED_EDITOR_HOST || "edit.windreed.wiki").toLowerCase();
    const isEditorHost = url.hostname.toLowerCase() === editorHost;
    const isEditorPath = url.pathname === "/edit" || url.pathname.startsWith("/edit/");
    const isAdminApi = url.pathname === "/api/admin" || url.pathname.startsWith("/api/admin/");

    if (isEditorHost && url.pathname === "/") {
      url.pathname = "/edit";
      return Response.redirect(url, 302);
    }

    if (isEditorHost || isEditorPath || isAdminApi) {
      const headers = new Headers(request.headers);
      headers.delete("x-windreed-editor-email");
      headers.delete("x-windreed-editor-local");

      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      let email: string | null = local
        ? (env.WINDREED_LOCAL_ADMIN_EMAIL || env.WINDREED_ADMIN_EMAILS?.split(",")[0] || "local-admin@windreed.wiki").trim().toLowerCase()
        : null;
      if (!local) {
        try {
          email = await verifiedAccessEmail(request, env);
        } catch (error) {
          console.error("Cloudflare Access verification failed", error);
        }
      }

      if (!email) {
        if (isAdminApi) {
          return Response.json(
            { error: "Cloudflare Access 登录无效或尚未配置。" },
            { status: 401, headers: { "Cache-Control": "no-store" } },
          );
        }
        return new Response(
          "<!doctype html><meta charset=utf-8><title>需要登录</title><style>body{font-family:system-ui;background:#f4efe4;color:#213137;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:34rem;padding:3rem}h1{font-family:serif}</style><main><h1>此卷仅向受邀修史者开放</h1><p>登录信息无效，或 Cloudflare Access 尚未完成配置。请从 edit.windreed.wiki 重新进入。</p></main>",
          { status: 401, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
        );
      }

      headers.set("x-windreed-editor-email", email);
      if (local) headers.set("x-windreed-editor-local", "1");
      request = new Request(request, { headers });
    }

    // With `assets.run_worker_first` enabled, authenticated requests reach this
    // Worker before Cloudflare's static asset service. Serve the client bundle
    // explicitly; otherwise the app shell loads but its JavaScript modules 404.
    const isStaticAsset = url.pathname.startsWith("/assets/")
      || url.pathname.startsWith("/brand/")
      || url.pathname.startsWith("/characters/")
      || url.pathname.startsWith("/DnD/")
      || ["/favicon.svg", "/file.svg", "/globe.svg", "/window.svg"].includes(url.pathname);
    if (isStaticAsset && env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      if (isEditorHost) {
        const headers = new Headers(response.headers);
        headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
      return response;
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const shouldCachePublicResponse = isPublicCacheableRequest(request, url, editorHost);
    let workerCache = shouldCachePublicResponse ? defaultWorkerCache() : null;
    const cacheKey = workerCache ? await publicCacheKey(request) : null;
    if (workerCache && cacheKey) {
      try {
        const cached = await workerCache.match(cacheKey);
        if (cached) return publicCacheResponse(cached, "HIT");
      } catch {
        workerCache = null;
      }
    }

    const response = await handler.fetch(request, env, ctx);
    if (isEditorHost || isEditorPath || isAdminApi) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    if (workerCache && cacheKey && response.ok && !response.headers.has("Set-Cookie")) {
      const cacheable = publicCacheResponse(response, "MISS");
      try {
        ctx.waitUntil(workerCache.put(cacheKey, cacheable.clone()).catch(() => undefined));
      } catch {
        return response;
      }
      return cacheable;
    }
    return response;
  },
};

export default worker;

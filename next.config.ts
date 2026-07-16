import type { NextConfig } from "next";

const githubPagesBuild = process.env.GITHUB_PAGES === "true";
const requestedBasePath = process.env.PAGES_BASE_PATH;
const pagesBasePath = requestedBasePath === "/"
  ? ""
  : requestedBasePath || "";

const nextConfig: NextConfig = {
  output: githubPagesBuild ? "export" : undefined,
  assetPrefix: githubPagesBuild ? pagesBasePath : undefined,
  trailingSlash: githubPagesBuild,
};

export default nextConfig;

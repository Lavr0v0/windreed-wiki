import type { Metadata, Viewport } from "next";
import { siteHref } from "./archive-manifest";
import { ArchiveShell } from "./components/ArchiveShell";
import { MotionLayer } from "./components/MotionLayer";
import "@fontsource-variable/noto-serif-sc/wght.css";
import "@fontsource/lxgw-wenkai/500.css";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Windreed Wayfarers",
    template: "%s · The Windreed Wayfarers",
  },
  description: "风芦旅人的人物生平、行程与共同经历公开档案。",
  applicationName: "The Windreed Wayfarers",
  icons: {
    icon: [{ url: siteHref("/brand/final/windreed-logo-favicon.svg"), type: "image/svg+xml" }],
    shortcut: [siteHref("/brand/final/windreed-logo-favicon.svg")],
  },
  openGraph: {
    title: "The Windreed Wayfarers",
    description: "风芦旅人的人物生平、行程与共同经历公开档案。",
    siteName: "The Windreed Wayfarers",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "The Windreed Wayfarers",
    description: "风芦旅人的人物生平、行程与共同经历公开档案。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#162c33",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <MotionLayer>
          <ArchiveShell>{children}</ArchiveShell>
        </MotionLayer>
      </body>
    </html>
  );
}

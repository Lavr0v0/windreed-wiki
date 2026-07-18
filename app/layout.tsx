import type { Metadata, Viewport } from "next";
import { siteHref } from "./archive-manifest";
import { ArchiveShell } from "./components/ArchiveShell";
import { MotionLayer } from "./components/MotionLayer";
import "@fontsource-variable/cinzel/wght.css";
import "@fontsource-variable/noto-serif-sc/wght.css";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://windreed.wiki"),
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
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Windreed Wayfarers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Windreed Wayfarers",
    description: "风芦旅人的人物生平、行程与共同经历公开档案。",
    images: ["/og.png"],
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "The Windreed Wayfarers · English Archive",
    template: "%s · The Windreed Wayfarers",
  },
  description:
    "The English public archive of the Windreed Wayfarers: their lives, road, relics, and shared history on the Sword Coast.",
  alternates: {
    canonical: "/en",
    languages: {
      "en": "/en",
      "zh-CN": "/",
    },
  },
  openGraph: {
    title: "The Windreed Wayfarers · English Archive",
    description:
      "Six travelers, one road, and the lives that became a company on the Sword Coast.",
    locale: "en_US",
    url: "/en",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Windreed Wayfarers · English Archive",
    description:
      "Six travelers, one road, and the lives that became a company on the Sword Coast.",
    images: ["/og.png"],
  },
};

export default function EnglishLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div lang="en">{children}</div>;
}

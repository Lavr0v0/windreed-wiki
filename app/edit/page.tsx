import type { Metadata } from "next";
import { EditorApp } from "../editor/components/EditorApp";
import "./editor.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "档案修史室",
  description: "The Windreed Wayfarers 的受邀档案编辑室。",
  robots: { index: false, follow: false, nocache: true },
};

export default function EditPage() {
  return <EditorApp />;
}

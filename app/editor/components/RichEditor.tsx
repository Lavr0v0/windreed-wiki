"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import type { EntryListItem, TiptapNode } from "../lib/types";

type RichEditorProps = {
  value: TiptapNode;
  onChange: (value: TiptapNode) => void;
  entries: EntryListItem[];
  entryId: string | null;
};

export function RichEditor({ value, onChange, entries, entryId }: RichEditorProps) {
  const [linkTarget, setLinkTarget] = useState("");
  const incomingValue = useRef(value);
  incomingValue.current = value;
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: { openOnClick: false, autolink: false, defaultProtocol: "https" },
      codeBlock: false,
    }),
    Placeholder.configure({
      placeholder: "从这里开始缮写这段故事……",
    }),
  ], []);
  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "record-editor-prose",
        spellcheck: "true",
        "aria-label": "词条正文",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON() as TiptapNode),
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(incomingValue.current, { emitUpdate: false });
  }, [editor, entryId]);

  if (!editor) return <div className="editor-loading-card">正在展开卷页……</div>;
  const currentEditor = editor;

  function insertArchiveLink() {
    const target = entries.find((entry) => entry.id === linkTarget);
    if (!target) return;
    const href = `/archive/${target.category}/${target.slug}`;
    const selection = currentEditor.state.selection;
    if (selection.empty) {
      currentEditor.chain().focus().insertContent({
        type: "text",
        text: target.payload.title,
        marks: [{ type: "link", attrs: { href } }],
      }).run();
    } else {
      currentEditor.chain().focus().setLink({ href }).run();
    }
    setLinkTarget("");
  }

  function setExternalLink() {
    const previous = currentEditor.getAttributes("link").href as string | undefined;
    const href = window.prompt("输入链接地址（https://…）", previous || "https://");
    if (href === null) return;
    if (!href.trim()) {
      currentEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    currentEditor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  const button = (label: string, action: () => void, active = false, disabled = false) => (
    <button
      className={active ? "active" : ""}
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={action}
    >
      {label}
    </button>
  );

  return (
    <div className="record-editor">
      <div className="record-toolbar" role="toolbar" aria-label="正文格式">
        <div className="toolbar-group">
          {button("正文", () => currentEditor.chain().focus().setParagraph().run(), currentEditor.isActive("paragraph"))}
          {button("章", () => currentEditor.chain().focus().toggleHeading({ level: 2 }).run(), currentEditor.isActive("heading", { level: 2 }))}
          {button("节", () => currentEditor.chain().focus().toggleHeading({ level: 3 }).run(), currentEditor.isActive("heading", { level: 3 }))}
        </div>
        <div className="toolbar-group">
          {button("粗体", () => currentEditor.chain().focus().toggleBold().run(), currentEditor.isActive("bold"))}
          {button("斜体", () => currentEditor.chain().focus().toggleItalic().run(), currentEditor.isActive("italic"))}
          {button("引文", () => currentEditor.chain().focus().toggleBlockquote().run(), currentEditor.isActive("blockquote"))}
        </div>
        <div className="toolbar-group">
          {button("项目", () => currentEditor.chain().focus().toggleBulletList().run(), currentEditor.isActive("bulletList"))}
          {button("编号", () => currentEditor.chain().focus().toggleOrderedList().run(), currentEditor.isActive("orderedList"))}
          {button("分隔线", () => currentEditor.chain().focus().setHorizontalRule().run())}
        </div>
        <div className="toolbar-link-group">
          <label>
            <select aria-label="选择要链接的档案" value={linkTarget} onChange={(event) => setLinkTarget(event.target.value)}>
              <option value="">链接到档案……</option>
              {entries.filter((candidate) => candidate.id !== entryId).map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.payload.title} · {candidate.payload.englishTitle || candidate.slug}
                </option>
              ))}
            </select>
          </label>
          {button("插入", insertArchiveLink, false, !linkTarget)}
          {button("外链", setExternalLink, currentEditor.isActive("link"))}
        </div>
        <div className="toolbar-group toolbar-history">
          {button("↶", () => currentEditor.chain().focus().undo().run(), false, !currentEditor.can().undo())}
          {button("↷", () => currentEditor.chain().focus().redo().run(), false, !currentEditor.can().redo())}
        </div>
      </div>
      <EditorContent editor={currentEditor} />
    </div>
  );
}

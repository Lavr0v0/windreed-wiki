"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useModalDialog } from "../../components/useModalDialog";
import { editorApi, errorMessage } from "../lib/client";
import {
  EMPTY_ENTRY,
  ENTRY_CATEGORIES,
  ENTRY_SECTIONS,
  type EditorIdentity,
  type EntryListItem,
  type EntryPayload,
  type RevisionItem,
} from "../lib/types";

const RichEditor = lazy(() => import("./RichEditor").then((module) => ({ default: module.RichEditor })));
const CollaboratorsPanel = lazy(() => import("./CollaboratorsPanel").then((module) => ({ default: module.CollaboratorsPanel })));
const ContentSyncPanel = lazy(() => import("./ContentSyncPanel").then((module) => ({ default: module.ContentSyncPanel })));

type SaveStatus = "saved" | "dirty" | "saving" | "error";

function freshEntry(): EntryPayload {
  return JSON.parse(JSON.stringify(EMPTY_ENTRY)) as EntryPayload;
}

function updateList(entries: EntryListItem[], updated: EntryListItem) {
  const next = entries.filter((entry) => entry.id !== updated.id);
  return [updated, ...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function EditorApp() {
  const [identity, setIdentity] = useState<EditorIdentity | null>(null);
  const [publicSiteConnected, setPublicSiteConnected] = useState(false);
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payload, setPayload] = useState<EntryPayload>(freshEntry);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<"idle" | "saving" | "publishing">("idle");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"ok" | "error">("ok");
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showContentSync, setShowContentSync] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const catalogButtonRef = useRef<HTMLButtonElement>(null);
  const catalogDialogRef = useRef<HTMLElement>(null);
  const closeCatalog = useCallback(() => setCatalogOpen(false), []);

  useModalDialog({
    dialogRef: catalogDialogRef,
    lockScroll: true,
    onClose: closeCatalog,
    open: catalogOpen,
    triggerRef: catalogButtonRef,
  });

  const selected = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  );

  const visibleEntries = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase("zh-CN");
    if (!query) return entries;
    return entries.filter((entry) => [
      entry.payload.title,
      entry.payload.englishTitle,
      entry.slug,
      entry.payload.aliases.join(" "),
    ].join(" ").toLocaleLowerCase("zh-CN").includes(query));
  }, [entries, filter]);
  const saveStatusLabel: Record<SaveStatus, string> = {
    saved: "已保存",
    dirty: "未保存",
    saving: "自动保存中",
    error: "保存失败",
  };

  useEffect(() => {
    Promise.all([
      editorApi<{ identity: EditorIdentity; publicSiteConnected: boolean }>("/api/admin/me"),
      editorApi<{ entries: EntryListItem[] }>("/api/admin/entries"),
    ])
      .then(([me, archive]) => {
        setIdentity(me.identity);
        setPublicSiteConnected(me.publicSiteConnected);
        setEntries(archive.entries);
        if (archive.entries[0]) selectLoaded(archive.entries[0]);
      })
      .catch((error) => {
        setMessageKind("error");
        setMessage(errorMessage(error));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  function selectLoaded(entry: EntryListItem) {
    setSelectedId(entry.id);
    setPayload(entry.payload);
    setRevision(entry.currentRevision);
    setDirty(false);
    setSaveStatus("saved");
    setMessage("");
    setShowHistory(false);
  }

  function chooseEntry(entry: EntryListItem) {
    if (dirty && !window.confirm("当前卷页还有未保存的修改。确定要离开吗？")) return;
    selectLoaded(entry);
    closeCatalog();
  }

  function beginNewEntry() {
    if (dirty && !window.confirm("当前卷页还有未保存的修改。确定要新建吗？")) return;
    setSelectedId(null);
    setPayload(freshEntry());
    setRevision(0);
    setDirty(false);
    setSaveStatus("saved");
    setMessage("");
    setShowHistory(false);
    closeCatalog();
  }

  function change<K extends keyof EntryPayload>(key: K, value: EntryPayload[K]) {
    setPayload((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setSaveStatus("dirty");
    setMessage("");
  }

  function changeFact(index: number, key: "label" | "value", value: string) {
    const facts = payload.facts.map((fact, factIndex) => factIndex === index ? { ...fact, [key]: value } : fact);
    change("facts", facts);
  }

  function removeFact(index: number) {
    change("facts", payload.facts.filter((_, factIndex) => factIndex !== index));
  }

  const save = useCallback(async (quiet = false): Promise<EntryListItem | null> => {
    if (busy || (!dirty && selectedId)) return selected;
    setBusy(true);
    setBusyAction("saving");
    setSaveStatus("saving");
    if (!quiet) setMessage("");
    try {
      const data = selectedId
        ? await editorApi<{ entry: EntryListItem }>(`/api/admin/entries/${selectedId}/draft`, {
            method: "PUT",
            body: JSON.stringify({ expectedRevision: revision, payload }),
          })
        : await editorApi<{ entry: EntryListItem }>("/api/admin/entries", {
            method: "POST",
            body: JSON.stringify({ payload }),
          });
      setEntries((current) => updateList(current, data.entry));
      setSelectedId(data.entry.id);
      setRevision(data.entry.currentRevision);
      setPayload(data.entry.payload);
      setDirty(false);
      setSaveStatus("saved");
      setMessageKind("ok");
      if (!quiet) setMessage("草稿已经收进卷册");
      return data.entry;
    } catch (error) {
      setMessageKind("error");
      setMessage(errorMessage(error));
      setSaveStatus("error");
      return null;
    } finally {
      setBusy(false);
      setBusyAction("idle");
    }
  }, [busy, dirty, payload, revision, selected, selectedId]);

  useEffect(() => {
    if (!dirty || !selectedId || busy) return;
    const timer = window.setTimeout(() => void save(true), 2600);
    return () => window.clearTimeout(timer);
  }, [busy, dirty, payload, save, selectedId]);

  async function publish() {
    let current = selected;
    if (dirty || !selectedId) current = await save(false);
    if (!current) return;
    setBusy(true);
    setBusyAction("publishing");
    setMessage("");
    try {
      const data = await editorApi<{ entry: EntryListItem }>(`/api/admin/entries/${current.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ expectedRevision: current.currentRevision }),
      });
      setEntries((items) => updateList(items, data.entry));
      setRevision(data.entry.currentRevision);
      setMessageKind("ok");
      setMessage(publicSiteConnected
        ? "这一版已经公开，访客刷新公开页面后即可看到修改。"
        : "这一版已发布到档案数据库。当前公开站仍是 GitHub Pages 版本，切换到数据库站点后才会显示。"
      );
    } catch (error) {
      setMessageKind("error");
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
      setBusyAction("idle");
    }
  }

  async function openHistory() {
    if (!selectedId) return;
    setShowHistory(true);
    setMessage("");
    try {
      const data = await editorApi<{ revisions: RevisionItem[] }>(`/api/admin/entries/${selectedId}/revisions`);
      setRevisions(data.revisions);
    } catch (error) {
      setMessageKind("error");
      setMessage(errorMessage(error));
    }
  }

  async function restore(item: RevisionItem) {
    if (!selectedId || !window.confirm(`把版本 ${item.revision} 恢复为新的草稿吗？当前版本仍会保留在历史中。`)) return;
    setBusy(true);
    try {
      const data = await editorApi<{ entry: EntryListItem }>(`/api/admin/entries/${selectedId}/restore`, {
        method: "POST",
        body: JSON.stringify({ revision: item.revision, expectedRevision: revision }),
      });
      setEntries((items) => updateList(items, data.entry));
      selectLoaded(data.entry);
      setMessageKind("ok");
      setMessage(`已把版本 ${item.revision} 恢复为新草稿。`);
    } catch (error) {
      setMessageKind("error");
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function bootstrap() {
    if (!window.confirm("把目前公开站的正式内容导入数据库并标记为已发布吗？这只会补充尚不存在的词条。")) return;
    setBusy(true);
    try {
      const data = await editorApi<{ imported: string[]; skipped: string[] }>("/api/admin/bootstrap", { method: "POST" });
      const refreshed = await editorApi<{ entries: EntryListItem[] }>("/api/admin/entries");
      setEntries(refreshed.entries);
      if (!selectedId && refreshed.entries[0]) selectLoaded(refreshed.entries[0]);
      setMessageKind("ok");
      setMessage(`已导入 ${data.imported.length} 个词条；跳过 ${data.skipped.length} 个已有词条。`);
    } catch (error) {
      setMessageKind("error");
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function refreshEntriesAfterSync() {
    const refreshed = await editorApi<{ entries: EntryListItem[] }>("/api/admin/entries");
    setEntries(refreshed.entries);
    if (selectedId) {
      const current = refreshed.entries.find((entry) => entry.id === selectedId);
      if (current) selectLoaded(current);
    } else if (refreshed.entries[0]) {
      selectLoaded(refreshed.entries[0]);
    }
  }

  if (loading) {
    return (
      <main className="editor-loading">
        <span className="editor-seal editor-loading-mark">
          <Image
            alt=""
            height={52}
            priority
            src="/brand/windreed-wayfarers-mark-user-refined.svg"
            unoptimized
            width={52}
          />
        </span>
        <p>正在开启修史室……</p>
      </main>
    );
  }

  return (
    <main className="editor-app">
      <header className="editor-topbar">
        <div className="editor-topbar-start">
        <button
          aria-expanded={catalogOpen}
          aria-label="打开卷册目录"
          className="editor-catalog-trigger"
          onClick={() => setCatalogOpen(true)}
          ref={catalogButtonRef}
          type="button"
        >☰</button>
        <div className="editor-brand">
          <span className="editor-brand-mark" aria-hidden="true">
            <Image
              alt=""
              height={42}
              priority
              src="/brand/final/windreed-logo-on-dark.svg"
              unoptimized
              width={42}
            />
          </span>
          <span><strong>The Windreed Wayfarers</strong><small>ARCHIVE SCRIPTORIUM · 档案修史室</small></span>
        </div>
        </div>
        <span aria-live="polite" className={`editor-save-status ${saveStatus}`}>
          <i aria-hidden="true" />{saveStatusLabel[saveStatus]}
        </span>
        <div className="editor-account">
          <span><strong>{identity?.displayName}</strong><small>{identity?.role === "admin" ? "管理员" : "协作者"}</small></span>
          <a href="/cdn-cgi/access/logout">退出</a>
        </div>
      </header>

      <button
        aria-label="关闭卷册目录"
        className={catalogOpen ? "editor-catalog-scrim open" : "editor-catalog-scrim"}
        onClick={closeCatalog}
        tabIndex={catalogOpen ? 0 : -1}
        type="button"
      />
      <aside className="editor-sidebar" data-state={catalogOpen ? "open" : "closed"} ref={catalogDialogRef} tabIndex={-1}>
        <div className="editor-sidebar-heading">
          <div><span className="editor-eyebrow">THE CATALOGUE</span><h1>卷册目录</h1></div>
          <button type="button" onClick={beginNewEntry} aria-label="新建词条">＋</button>
        </div>
        <label className="editor-search">
          <span aria-hidden="true">⌕</span>
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="检索卷册" />
        </label>
        <nav className="editor-entry-list" aria-label="可编辑词条">
          {visibleEntries.map((entry) => (
            <button
              className={entry.id === selectedId ? "active" : ""}
              type="button"
              key={entry.id}
              onClick={() => chooseEntry(entry)}
            >
              <span className="entry-list-mark" style={{ background: entry.payload.accent }}>{entry.payload.monogram}</span>
              <span><strong>{entry.payload.title}</strong><small>{entry.payload.englishTitle || entry.slug}</small></span>
              <em className={entry.status === "published" && entry.currentRevision !== entry.publishedRevision ? "pending" : entry.status}>
                {entry.status !== "published" ? "草稿" : entry.currentRevision === entry.publishedRevision ? "已刊" : "待发布"}
              </em>
            </button>
          ))}
          {!visibleEntries.length && <p className="empty-list">这册中还没有可编辑的词条。</p>}
        </nav>
        <div className="editor-sidebar-actions">
          {identity?.role === "admin" && (
            <>
              <button type="button" onClick={() => setShowCollaborators(true)}>协作者与权限</button>
              <button type="button" onClick={() => setShowContentSync(true)}>内容同步</button>
              {!entries.length && <button type="button" onClick={bootstrap}>导入现有公开档案</button>}
            </>
          )}
          <a href="https://windreed.wiki" target="_blank" rel="noreferrer">查看公开网站 ↗</a>
        </div>
      </aside>

      <section className="editor-workspace">
        <div className="editor-page">
          <header className="entry-editor-header">
            <div>
              <span className="editor-eyebrow">{selectedId ? `REVISION ${String(revision).padStart(2, "0")}` : "A NEW LEAF"}</span>
              <h2>{selectedId ? payload.title : "新建卷页"}</h2>
              <p>{selectedId ? "每次保存都会留下可以恢复的版本。" : "先写标题、摘要与 URL 路径，再开始正文。"}</p>
            </div>
            <div className="entry-editor-actions">
              {selectedId && <button className="secondary-editor-button" type="button" onClick={openHistory}>版本历史</button>}
              <button className="secondary-editor-button" type="button" disabled={busy || (!dirty && Boolean(selectedId))} onClick={() => void save(false)}>
                {busyAction === "saving" ? "收卷中……" : "保存草稿"}
              </button>
              <button className="primary-editor-button" type="button" disabled={busy || (selected ? !selected.canPublish : identity?.role !== "admin")} onClick={publish}>
                {busyAction === "publishing" ? "发布中……" : "发布这一版"}
              </button>
            </div>
          </header>

          {message && <div className={`editor-notice ${messageKind}`} role="status">{message.split("\n").map((line) => <span key={line}>{line}</span>)}</div>}

          <section className="entry-metadata-card">
            <div className="field-grid two-columns">
              <label><span>中文标题 *</span><input value={payload.title} onChange={(event) => change("title", event.target.value)} /></label>
              <label><span>英文名或别名</span><input value={payload.englishTitle} onChange={(event) => change("englishTitle", event.target.value)} /></label>
              <label>
                <span>所属分类 *</span>
                <select value={payload.category} onChange={(event) => {
                  const category = event.target.value as EntryPayload["category"];
                  const section = ENTRY_SECTIONS.find((item) => item.category === category)?.value ?? "lore";
                  setPayload((current) => ({ ...current, category, section }));
                  setDirty(true);
                  setSaveStatus("dirty");
                }}>
                  {ENTRY_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                <span>卷册 *</span>
                <select value={payload.section} onChange={(event) => change("section", event.target.value)}>
                  {ENTRY_SECTIONS.filter((option) => option.category === payload.category).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>公开 URL 路径（slug）*</span>
                <div className="slug-field"><small>windreed.wiki/archive/{payload.category}/</small><input aria-label="公开 URL 路径" value={payload.slug} onChange={(event) => change("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="emberford" /></div>
                <small className="field-help">这是永久链接的一部分，只能使用小写英文字母、数字和连字符；发布后尽量不要更改。</small>
              </label>
              <label><span>其他称呼</span><input value={payload.aliases.join("，")} onChange={(event) => change("aliases", event.target.value.split(/[，,]/).map((item) => item.trim()).filter(Boolean))} placeholder="用逗号分开" /></label>
            </div>
            <label><span>公开摘要 *</span><textarea rows={3} value={payload.summary} onChange={(event) => change("summary", event.target.value)} /></label>
            <details>
              <summary>外观与关联设置</summary>
              <div className="field-grid three-columns detail-fields">
                <label><span>文字徽记</span><input maxLength={4} value={payload.monogram} onChange={(event) => change("monogram", event.target.value)} /></label>
                <label><span>识别色</span><div className="color-field"><input type="color" value={payload.accent} onChange={(event) => change("accent", event.target.value)} /><code>{payload.accent}</code></div></label>
                <label><span>展示方式</span><select value={payload.presentation} onChange={(event) => change("presentation", event.target.value as EntryPayload["presentation"])}><option value="archive">完整档案</option><option value="glossary">浮窗词条</option></select></label>
                {payload.category === "characters" && <label><span>人物身份</span><select value={payload.characterRole} onChange={(event) => change("characterRole", event.target.value as EntryPayload["characterRole"])}><option value="">普通人物</option><option value="member">正式成员</option><option value="associate">同行者</option></select></label>}
                {payload.category === "characters" && <label><span>角色页面 URL</span><input value={payload.personalPage} onChange={(event) => change("personalPage", event.target.value)} placeholder="/characters/shirul/" /></label>}
                <label><span>来源标记</span><input value={payload.sourceLabel} onChange={(event) => change("sourceLabel", event.target.value)} /></label>
              </div>
              <div className="fact-editor">
                <div className="fact-editor-heading">
                  <span>档案名片字段</span>
                  <button type="button" onClick={() => change("facts", [...payload.facts, { label: "", value: "" }])}>＋ 添加一项</button>
                </div>
                {payload.facts.map((fact, index) => (
                  <div className="fact-editor-row" key={index}>
                    <input aria-label={`名片字段 ${index + 1} 名称`} value={fact.label} onChange={(event) => changeFact(index, "label", event.target.value)} placeholder="例如：职业" />
                    <input aria-label={`名片字段 ${index + 1} 内容`} value={fact.value} onChange={(event) => changeFact(index, "value", event.target.value)} placeholder="例如：圣武士 · 古贤之誓" />
                    <button type="button" aria-label={`删除名片字段 ${index + 1}`} onClick={() => removeFact(index)}>×</button>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="body-editor-section">
            <div className="body-editor-heading"><span className="editor-eyebrow">THE RECORD</span><h3>正文</h3><p>可以直接像普通文档一样输入、选中文字并设置格式。</p></div>
            <Suspense fallback={<div className="editor-loading-card">正在展开正文编辑器……</div>}>
              <RichEditor value={payload.body} onChange={(body) => change("body", body)} entries={entries} entryId={selectedId} />
            </Suspense>
          </section>
        </div>
      </section>

      {showHistory && (
        <aside className="history-drawer" aria-label="版本历史">
          <header><div><span className="editor-eyebrow">REVISION LEDGER</span><h2>版本历史</h2></div><button className="icon-button" type="button" onClick={() => setShowHistory(false)}>×</button></header>
          <p>恢复不会删除后来的版本，只会另存为一份新草稿。</p>
          <div className="revision-list">
            {revisions.map((item) => (
              <article key={item.revision}>
                <span className="revision-number">{String(item.revision).padStart(2, "0")}</span>
                <div><strong>{item.note || "保存草稿"}</strong><small>{new Date(item.createdAt).toLocaleString("zh-CN")} · {item.createdBy}</small><div>{item.isCurrent && <em>当前</em>}{item.isPublished && <em>公开</em>}</div></div>
                {!item.isCurrent && <button type="button" disabled={busy} onClick={() => restore(item)}>恢复</button>}
              </article>
            ))}
          </div>
        </aside>
      )}
      {showHistory && <button className="history-scrim" type="button" aria-label="关闭版本历史" onClick={() => setShowHistory(false)} />}
      {showCollaborators && (
        <Suspense fallback={<div className="editor-modal-loading" role="status">正在展开协作者面板……</div>}>
          <CollaboratorsPanel onClose={() => setShowCollaborators(false)} />
        </Suspense>
      )}
      {showContentSync && (
        <Suspense fallback={<div className="editor-modal-loading" role="status">正在展开内容同步……</div>}>
          <ContentSyncPanel
            importDisabled={dirty}
            onClose={() => setShowContentSync(false)}
            onImported={refreshEntriesAfterSync}
          />
        </Suspense>
      )}
    </main>
  );
}

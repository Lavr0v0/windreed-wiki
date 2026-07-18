"use client";

import { useRef, useState } from "react";
import { editorApi, errorMessage } from "../lib/client";
import type {
  ContentSyncImportResult,
  ContentSyncPackage,
} from "../lib/types";

type ContentSyncPanelProps = {
  importDisabled?: boolean;
  onClose: () => void;
  onImported: () => Promise<void>;
};

const MAX_PACKAGE_SIZE = 10 * 1024 * 1024;

function countSummary(result: ContentSyncImportResult) {
  return [
    `新建草稿 ${result.created.length}`,
    `更新草稿 ${result.updated.length}`,
    `无需更新 ${result.unchanged.length}`,
    `冲突 ${result.conflicts.length}`,
  ].join(" · ");
}

export function ContentSyncPanel({ importDisabled = false, onClose, onImported }: ContentSyncPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ContentSyncImportResult | null>(null);

  async function importPackage() {
    if (!file || importDisabled) return;
    setBusy(true);
    setMessage("");
    setResult(null);
    try {
      if (file.size > MAX_PACKAGE_SIZE) throw new Error("同步包超过 10 MB，未导入。");
      const syncPackage = JSON.parse(await file.text()) as ContentSyncPackage;
      const imported = await editorApi<ContentSyncImportResult>("/api/admin/sync/import", {
        method: "POST",
        body: JSON.stringify(syncPackage),
      });
      setResult(imported);
      setMessage(imported.conflicts.length
        ? "其余草稿已导入；发生冲突的词条没有被覆盖。"
        : "本地推送包已经导入为线上草稿。请检查内容后再逐条发布。"
      );
      await onImported();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="editor-modal-layer" role="presentation">
      <button className="editor-modal-scrim" type="button" aria-label="关闭内容同步面板" onClick={onClose} />
      <section className="content-sync-panel" role="dialog" aria-modal="true" aria-labelledby="content-sync-title">
        <header>
          <div>
            <span className="editor-eyebrow">CONTENT SYNCHRONIZATION</span>
            <h2 id="content-sync-title">内容同步</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <p className="panel-help">
          内容同步只传递公开档案字段，不会上传整个 Obsidian 仓库。导入只生成草稿，也不会自动发布。
        </p>

        <ol className="sync-workflow" aria-label="本地与线上同步流程">
          <li><span>01</span><div><strong>拉取线上版本</strong><small>先下载线上同步包，再交给本地脚本检查版本与冲突。</small></div></li>
          <li><span>02</span><div><strong>在 Obsidian 修改</strong><small>继续编辑现有 Markdown 源文件，不需要复制到后台。</small></div></li>
          <li><span>03</span><div><strong>推送本地草稿</strong><small>本地脚本生成推送包；修史室导入后人工检查并发布。</small></div></li>
        </ol>

        <div className="sync-actions">
          <article>
            <span className="sync-action-number">A</span>
            <div>
              <h3>导出线上版本</h3>
              <p>下载当前线上词条和各自的版本号，用于本地“拉取版本”和冲突检测。</p>
              <a className="secondary-editor-button sync-download" href="/api/admin/sync/export" download>
                下载线上同步包
              </a>
            </div>
          </article>

          <article>
            <span className="sync-action-number">B</span>
            <div>
              <h3>导入本地推送包</h3>
              <p>选择本地生成的 <code>.windreed-sync/outbox.json</code>。线上版本不一致时会报告冲突。</p>
              <div className="sync-file-row">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setMessage("");
                    setResult(null);
                  }}
                />
                <button className="secondary-editor-button" type="button" onClick={() => inputRef.current?.click()}>
                  {file ? "更换文件" : "选择推送包"}
                </button>
                <span title={file?.name}>{file?.name ?? "尚未选择文件"}</span>
              </div>
              {importDisabled && <p className="sync-warning">当前卷页有未保存修改。请先保存草稿，再导入同步包。</p>}
              <button className="primary-editor-button" type="button" disabled={busy || !file || importDisabled} onClick={importPackage}>
                {busy ? "导入中……" : "导入为草稿"}
              </button>
            </div>
          </article>
        </div>

        {message && <div className={`sync-result ${result?.conflicts.length ? "warning" : result ? "ok" : "error"}`} role="status">
          <strong>{result ? countSummary(result) : "导入未完成"}</strong>
          <p>{message}</p>
          {result?.conflicts.length ? (
            <ul>
              {result.conflicts.map((conflict) => (
                <li key={conflict.slug}><code>{conflict.slug}</code>：{conflict.reason}（本地基准 {conflict.localBaseRevision ?? "无"} / 线上版本 {conflict.onlineRevision ?? "无"}）</li>
              ))}
            </ul>
          ) : null}
        </div>}

        <details className="sync-command-help">
          <summary>本地命令速查</summary>
          <pre><code>{`npm run content:pull -- <下载的同步包路径>\nnpm run content:status\nnpm run content:push`}</code></pre>
          <p>导入并发布后，再次导出并拉取线上版本，便会建立新的共同基准。</p>
        </details>
      </section>
    </div>
  );
}

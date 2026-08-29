"use client";

import { useEffect, useMemo, useState } from "react";
import { editorApi, errorMessage } from "../lib/client";
import type { EditorAccount } from "../lib/types";

type CollaboratorsPanelProps = {
  onClose: () => void;
};

export function CollaboratorsPanel({ onClose }: CollaboratorsPanelProps) {
  const [accounts, setAccounts] = useState<EditorAccount[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    editorApi<{ editors: EditorAccount[] }>("/api/admin/editors")
      .then((data) => {
        setAccounts(data.editors);
      })
      .catch((error) => setMessage(errorMessage(error)));
  }, []);

  const selected = useMemo(
    () => accounts.find((account) => account.email === selectedEmail),
    [accounts, selectedEmail],
  );

  function newAccount() {
    setSelectedEmail("");
    setEmail("");
    setDisplayName("");
    setActive(true);
    setMessage("");
  }

  function chooseAccount(account: EditorAccount) {
    setSelectedEmail(account.email);
    setEmail(account.email);
    setDisplayName(account.displayName);
    setActive(account.active);
    setMessage("");
  }

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const data = await editorApi<{ editors: EditorAccount[] }>("/api/admin/editors", {
        method: "PUT",
        body: JSON.stringify({ email, displayName, active }),
      });
      setAccounts(data.editors);
      setSelectedEmail(email.trim().toLowerCase());
      setMessage("协作者权限已经保存。启用后可编辑并直接发布全部词条；登录邮箱仍需加入 Cloudflare Access 白名单。");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="editor-modal-layer" role="presentation">
      <button className="editor-modal-scrim" type="button" aria-label="关闭协作者面板" onClick={onClose} />
      <section className="collaborator-panel" role="dialog" aria-modal="true" aria-labelledby="collaborator-title">
        <header>
          <div>
            <span className="editor-eyebrow">KEEPERS OF THE RECORD</span>
            <h2 id="collaborator-title">协作者</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <div className="collaborator-layout">
          <aside>
            <button className="new-collaborator" type="button" onClick={newAccount}>＋ 邀请新协作者</button>
            {accounts.map((account) => (
              <button
                className={selectedEmail === account.email ? "active" : ""}
                key={account.email}
                type="button"
                onClick={() => chooseAccount(account)}
              >
                <strong>{account.displayName}</strong>
                <small>{account.email}</small>
                {!account.active && <em>已停用</em>}
              </button>
            ))}
          </aside>
          <div className="collaborator-form">
            <p className="panel-help">启用的协作者可以编辑并直接发布全部现有词条，以及以后新增的词条。对方不需要 GitHub，也看不到你的 Obsidian。</p>
            <div className="field-grid two-columns">
              <label>
                <span>邮箱</span>
                <input
                  type="email"
                  value={email}
                  disabled={Boolean(selected)}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="friend@example.com"
                />
              </label>
              <label>
                <span>显示名</span>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="朋友的名字" />
              </label>
            </div>
            <label className="switch-row">
              <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
              <span><strong>允许登录</strong><small>关闭后会立即失去编辑权限。</small></span>
            </label>
            <div className="collaborator-scope" role="note">
              <span>权限范围</span>
              <strong>全部档案词条</strong>
              <small>包含当前内容与今后新增的词条，并允许直接发布。</small>
            </div>
            {message && <p className="editor-message" role="status">{message}</p>}
            <footer>
              <button className="secondary-editor-button" type="button" onClick={onClose}>取消</button>
              <button className="primary-editor-button" type="button" disabled={busy || !email.trim()} onClick={save}>
                {busy ? "保存中……" : "保存权限"}
              </button>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}

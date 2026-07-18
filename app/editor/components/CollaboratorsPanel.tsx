"use client";

import { useEffect, useMemo, useState } from "react";
import { editorApi, errorMessage } from "../lib/client";
import type { EditorAccount, EntryListItem } from "../lib/types";

type CollaboratorsPanelProps = {
  onClose: () => void;
};

export function CollaboratorsPanel({ onClose }: CollaboratorsPanelProps) {
  const [accounts, setAccounts] = useState<EditorAccount[]>([]);
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [active, setActive] = useState(true);
  const [entryIds, setEntryIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    editorApi<{ editors: EditorAccount[]; entries: EntryListItem[] }>("/api/admin/editors")
      .then((data) => {
        setAccounts(data.editors);
        setEntries(data.entries);
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
    setEntryIds([]);
    setMessage("");
  }

  function chooseAccount(account: EditorAccount) {
    setSelectedEmail(account.email);
    setEmail(account.email);
    setDisplayName(account.displayName);
    setActive(account.active);
    setEntryIds(account.entryIds);
    setMessage("");
  }

  function toggleEntry(entryId: string) {
    setEntryIds((current) => current.includes(entryId)
      ? current.filter((candidate) => candidate !== entryId)
      : [...current, entryId]);
  }

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const data = await editorApi<{ editors: EditorAccount[] }>("/api/admin/editors", {
        method: "PUT",
        body: JSON.stringify({ email, displayName, active, entryIds }),
      });
      setAccounts(data.editors);
      setSelectedEmail(email.trim().toLowerCase());
      setMessage("协作者权限已经保存。对方现在可以用这个邮箱接收登录验证码。");
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
            <p className="panel-help">只需填写朋友的邮箱并勾选允许修改的词条。对方不需要 GitHub，也看不到你的 Obsidian。</p>
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
            <fieldset className="assignment-list">
              <legend>可编辑并直接发布的词条</legend>
              {entries.map((entry) => (
                <label key={entry.id}>
                  <input
                    type="checkbox"
                    checked={entryIds.includes(entry.id)}
                    onChange={() => toggleEntry(entry.id)}
                  />
                  <span style={{ "--entry-accent": entry.payload.accent } as React.CSSProperties}>
                    <strong>{entry.payload.title}</strong>
                    <small>{entry.payload.englishTitle || entry.slug}</small>
                  </span>
                </label>
              ))}
              {!entries.length && <p>先初始化或建立词条，之后便可以在这里分配。</p>}
            </fieldset>
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

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repository = await readFile(new URL("../app/editor/lib/repository.server.ts", import.meta.url), "utf8");
const collaborators = await readFile(new URL("../app/editor/components/CollaboratorsPanel.tsx", import.meta.url), "utf8");
const migration = await readFile(new URL("../drizzle/0001_global_editor_access.sql", import.meta.url), "utf8");

test("active editor accounts can edit and publish every current and future entry", () => {
  assert.match(repository, /identity\.role === "admin" \|\| identity\.role === "editor"/);
  assert.match(repository, /SELECT e\.\*, r\.payload, 1 AS can_publish/);
  assert.doesNotMatch(repository, /WHERE \?1 = 1 OR p\.editor_email IS NOT NULL/);
  assert.doesNotMatch(repository, /INSERT INTO entry_permissions/);
});

test("collaborator settings describe one account-wide permission instead of entry checkboxes", () => {
  assert.match(collaborators, /全部档案词条/);
  assert.match(collaborators, /以后新增的词条/);
  assert.doesNotMatch(collaborators, /toggleEntry|entryIds|assignment-list/);
  assert.match(collaborators, /Cloudflare Access 白名单/);
});

test("database compatibility grants existing and future entries to every active editor", () => {
  assert.match(migration, /CROSS JOIN `editors`/);
  assert.match(migration, /grant_active_editors_new_entries/);
  assert.match(migration, /grant_new_active_editor_all_entries/);
  assert.match(migration, /grant_reactivated_editor_all_entries/);
});

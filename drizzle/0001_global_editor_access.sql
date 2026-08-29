INSERT OR IGNORE INTO `entry_permissions` (`entry_id`, `editor_email`, `can_publish`, `created_at`)
SELECT e.`id`, ed.`email`, 1, unixepoch() * 1000
FROM `entries` e
CROSS JOIN `editors` ed
WHERE ed.`role` = 'editor' AND ed.`active` = 1;
--> statement-breakpoint
UPDATE `entry_permissions`
SET `can_publish` = 1
WHERE `editor_email` IN (
  SELECT `email` FROM `editors` WHERE `role` = 'editor' AND `active` = 1
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `grant_active_editors_new_entries`
AFTER INSERT ON `entries`
BEGIN
  INSERT OR IGNORE INTO `entry_permissions` (`entry_id`, `editor_email`, `can_publish`, `created_at`)
  SELECT NEW.`id`, `email`, 1, unixepoch() * 1000
  FROM `editors`
  WHERE `role` = 'editor' AND `active` = 1;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `grant_new_active_editor_all_entries`
AFTER INSERT ON `editors`
WHEN NEW.`role` = 'editor' AND NEW.`active` = 1
BEGIN
  INSERT OR IGNORE INTO `entry_permissions` (`entry_id`, `editor_email`, `can_publish`, `created_at`)
  SELECT `id`, NEW.`email`, 1, unixepoch() * 1000 FROM `entries`;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `grant_reactivated_editor_all_entries`
AFTER UPDATE OF `active` ON `editors`
WHEN NEW.`role` = 'editor' AND NEW.`active` = 1
BEGIN
  INSERT OR IGNORE INTO `entry_permissions` (`entry_id`, `editor_email`, `can_publish`, `created_at`)
  SELECT `id`, NEW.`email`, 1, unixepoch() * 1000 FROM `entries`;
END;

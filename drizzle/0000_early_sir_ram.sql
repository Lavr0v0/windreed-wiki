CREATE TABLE `editors` (
	`email` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`role` text DEFAULT 'editor' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `editors_role_idx` ON `editors` (`role`);--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`section` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`current_revision` integer DEFAULT 0 NOT NULL,
	`published_revision` integer,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entries_slug_idx` ON `entries` (`slug`);--> statement-breakpoint
CREATE INDEX `entries_category_idx` ON `entries` (`category`);--> statement-breakpoint
CREATE INDEX `entries_section_idx` ON `entries` (`section`);--> statement-breakpoint
CREATE INDEX `entries_status_idx` ON `entries` (`status`);--> statement-breakpoint
CREATE TABLE `entry_permissions` (
	`entry_id` text NOT NULL,
	`editor_email` text NOT NULL,
	`can_publish` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`entry_id`, `editor_email`),
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`editor_email`) REFERENCES `editors`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entry_permissions_editor_idx` ON `entry_permissions` (`editor_email`);--> statement-breakpoint
CREATE TABLE `entry_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`plain_text` text NOT NULL,
	`note` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entry_revisions_entry_revision_idx` ON `entry_revisions` (`entry_id`,`revision`);--> statement-breakpoint
CREATE INDEX `entry_revisions_entry_idx` ON `entry_revisions` (`entry_id`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

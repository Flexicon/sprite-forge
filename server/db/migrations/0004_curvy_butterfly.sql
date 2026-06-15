CREATE TABLE `sprite_edits` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`storage_path` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sprite_edits_source_idx` ON `sprite_edits` (`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `sprite_edits_created_at_idx` ON `sprite_edits` (`created_at`);
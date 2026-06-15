PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_generation_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`upload_id` text,
	`source_mode` text DEFAULT 'image' NOT NULL,
	`status` text NOT NULL,
	`model` text NOT NULL,
	`user_prompt` text NOT NULL,
	`style_preset_id` text NOT NULL,
	`style_prompt` text NOT NULL,
	`target_width` integer NOT NULL,
	`target_height` integer NOT NULL,
	`variant_count` integer NOT NULL,
	`background_mode` text DEFAULT 'transparent' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`error_message` text,
	FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_generation_jobs` (`id`, `upload_id`, `source_mode`, `status`, `model`, `user_prompt`, `style_preset_id`, `style_prompt`, `target_width`, `target_height`, `variant_count`, `background_mode`, `created_at`, `error_message`)
SELECT `id`, `upload_id`, 'image', `status`, `model`, `user_prompt`, `style_preset_id`, `style_prompt`, `target_width`, `target_height`, `variant_count`, `background_mode`, `created_at`, `error_message` FROM `generation_jobs`;
--> statement-breakpoint
DROP TABLE `generation_jobs`;--> statement-breakpoint
ALTER TABLE `__new_generation_jobs` RENAME TO `generation_jobs`;--> statement-breakpoint
CREATE INDEX `generation_jobs_upload_id_idx` ON `generation_jobs` (`upload_id`);--> statement-breakpoint
CREATE INDEX `generation_jobs_status_idx` ON `generation_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `generation_jobs_created_at_idx` ON `generation_jobs` (`created_at`);--> statement-breakpoint
PRAGMA foreign_keys=ON;

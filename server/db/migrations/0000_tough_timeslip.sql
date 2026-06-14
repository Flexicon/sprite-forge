CREATE TABLE `generated_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`status` text NOT NULL,
	`variant_index` integer NOT NULL,
	`variant_direction` text NOT NULL,
	`model` text NOT NULL,
	`final_image_path` text,
	`preview_image_path` text,
	`openrouter_response_json` text,
	`error_message` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `generation_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `generated_variants_job_id_idx` ON `generated_variants` (`job_id`);--> statement-breakpoint
CREATE INDEX `generated_variants_status_idx` ON `generated_variants` (`status`);--> statement-breakpoint
CREATE INDEX `generated_variants_variant_index_idx` ON `generated_variants` (`job_id`,`variant_index`);--> statement-breakpoint
CREATE TABLE `generation_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`upload_id` text NOT NULL,
	`status` text NOT NULL,
	`model` text NOT NULL,
	`user_prompt` text NOT NULL,
	`style_preset_id` text NOT NULL,
	`style_prompt` text NOT NULL,
	`target_width` integer NOT NULL,
	`target_height` integer NOT NULL,
	`variant_count` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`error_message` text,
	FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `generation_jobs_upload_id_idx` ON `generation_jobs` (`upload_id`);--> statement-breakpoint
CREATE INDEX `generation_jobs_status_idx` ON `generation_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `generation_jobs_created_at_idx` ON `generation_jobs` (`created_at`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`storage_path` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const uploads = sqliteTable('uploads', {
  id: text('id').primaryKey(),
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  storagePath: text('storage_path').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const generationJobs = sqliteTable('generation_jobs', {
  id: text('id').primaryKey(),
  uploadId: text('upload_id')
    .notNull()
    .references(() => uploads.id, { onDelete: 'restrict' }),
  status: text('status', { enum: ['queued', 'running', 'completed', 'failed', 'cancelled'] }).notNull(),
  model: text('model').notNull(),
  userPrompt: text('user_prompt').notNull(),
  stylePresetId: text('style_preset_id').notNull(),
  stylePrompt: text('style_prompt').notNull(),
  targetWidth: integer('target_width').notNull(),
  targetHeight: integer('target_height').notNull(),
  variantCount: integer('variant_count').notNull(),
  backgroundMode: text('background_mode', { enum: ['transparent', 'plain'] }).notNull().default('transparent'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  errorMessage: text('error_message'),
}, (table) => [
  index('generation_jobs_upload_id_idx').on(table.uploadId),
  index('generation_jobs_status_idx').on(table.status),
  index('generation_jobs_created_at_idx').on(table.createdAt),
])

export const generatedVariants = sqliteTable('generated_variants', {
  id: text('id').primaryKey(),
  jobId: text('job_id')
    .notNull()
    .references(() => generationJobs.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['running', 'completed', 'failed'] }).notNull(),
  variantIndex: integer('variant_index').notNull(),
  variantDirection: text('variant_direction').notNull(),
  model: text('model').notNull(),
  rawImagePath: text('raw_image_path'),
  finalImagePath: text('final_image_path'),
  previewImagePath: text('preview_image_path'),
  openrouterResponseJson: text('openrouter_response_json'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('generated_variants_job_id_idx').on(table.jobId),
  index('generated_variants_status_idx').on(table.status),
  index('generated_variants_variant_index_idx').on(table.jobId, table.variantIndex),
])

export const uploadsRelations = relations(uploads, ({ many }) => ({
  jobs: many(generationJobs),
}))

export const generationJobsRelations = relations(generationJobs, ({ many, one }) => ({
  upload: one(uploads, {
    fields: [generationJobs.uploadId],
    references: [uploads.id],
  }),
  variants: many(generatedVariants),
}))

export const generatedVariantsRelations = relations(generatedVariants, ({ one }) => ({
  job: one(generationJobs, {
    fields: [generatedVariants.jobId],
    references: [generationJobs.id],
  }),
}))

export type Upload = typeof uploads.$inferSelect
export type NewUpload = typeof uploads.$inferInsert
export type GenerationJob = typeof generationJobs.$inferSelect
export type NewGenerationJob = typeof generationJobs.$inferInsert
export type GeneratedVariant = typeof generatedVariants.$inferSelect
export type NewGeneratedVariant = typeof generatedVariants.$inferInsert

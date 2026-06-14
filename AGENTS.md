# AGENTS.md

## Project Name

Sprite Forge

## Purpose

Build a self-hosted local web app for transforming uploaded 2D game sprite images into new sprite variants in different visual styles, especially pixel art.

The app should let a user upload a source image, describe the desired style or transformation, choose simple generation settings, generate 4-6 sprite candidates using OpenRouter image models, preview the results, and export the generated sprites as PNG files.

This is a local-first tool. Do not add authentication, billing, team management, cloud storage, OAuth, multi-tenant behavior, or hosted SaaS assumptions.

## Core Product Requirements

The app must support:

* Uploading a source sprite image.
* Entering a freeform prompt.
* Selecting a style preset.
* Selecting target sprite dimensions.
* Selecting number of variants: 4, 5, or 6.
* Generating sprite variants through OpenRouter.
* Processing generated images with Sharp.
* Saving generation jobs and outputs in SQLite.
* Displaying previous jobs locally.
* Exporting individual sprites as PNG.
* Exporting all generated variants for a job as a ZIP.
* Running locally on a self-hosted server.

## Preferred Stack

Use:

* Nuxt 4 or current stable Nuxt 3 if Nuxt 4 support causes friction.
* Vue 3.
* TypeScript.
* SQLite.
* Drizzle ORM preferred.
* Sharp for server-side image processing.
* OpenRouter for image generation.
* Node.js runtime.
* pnpm as package manager.
* Zod for runtime validation.
* Nitro server routes for API endpoints.
* Local filesystem storage for uploaded/generated images.
* No external database.
* No Redis.
* No queue system for the initial version.

## Environment Variables

The app should require only:

```env
OPENROUTER_API_KEY=
DATABASE_URL=file:./data/sprite-forge.sqlite
STORAGE_DIR=./data/storage
OPENROUTER_DEFAULT_MODEL=google/gemini-2.5-flash-image
```

Optional:

```env
OPENROUTER_SITE_URL=http://localhost:4179
OPENROUTER_APP_NAME=Sprite Forge
```

Do not require any other external service for the MVP.

## OpenRouter Requirements

Use OpenRouter Chat Completions for image generation.

Default model:

```txt
google/gemini-2.5-flash-image
```

Allow model override through environment variable and later through UI settings.

The generation request should:

* Send the uploaded source image as a base64 data URL.
* Send text instructions as structured prompt content.
* Request image output using `modalities: ["image", "text"]`.
* Expect generated images as base64 data URLs in the response.
* Persist the raw response metadata for debugging.
* Surface OpenRouter errors clearly in the UI.

Do not hardcode provider-specific assumptions beyond OpenRouter’s API contract unless isolated behind a model adapter.

## Image Generation Behavior

Generate each candidate as a separate model call.

Do not ask the model to produce a contact sheet or grid of sprites.

Reason: the app needs clean individual PNG outputs, and splitting generated grids is unreliable.

For a 4-variant generation job, perform 4 separate image-generation requests. The same applies to 5 or 6 variants.

Each variant prompt should include a small variation directive so the candidates are distinct while preserving the source subject.

Example variant directives:

```txt
Variant 1: most faithful to the original silhouette.
Variant 2: slightly more stylized and expressive.
Variant 3: stronger game-ready pixel-art interpretation.
Variant 4: alternate palette while preserving the same subject.
Variant 5: more dramatic lighting and contrast.
Variant 6: cleaner simplified low-detail sprite.
```

## Prompt Template

Use this as the initial generation prompt shape:

```txt
Transform the provided source image into a single 2D game sprite.

Style preset:
{stylePreset}

User direction:
{userPrompt}

Output target:
- Intended final sprite size: {targetWidth}x{targetHeight}px
- Sprite should remain readable at that final size.
- The generated image may be larger, but it must be suitable for deterministic downscaling.

Variant direction:
{variantDirection}

Hard constraints:
- Preserve the main subject identity and silhouette from the source image.
- Create one centered sprite, not a scene and not a full illustration.
- Use a transparent background if possible. If transparency is not possible, use a flat plain background with strong subject separation.
- No text.
- No watermark.
- No border.
- No UI frame.
- No sprite sheet.
- No multiple characters unless explicitly requested.
- Avoid tiny details that will collapse at the target size.
- Prefer clean readable shapes.
- Prefer game asset readability over painterly detail.
```

## Style Presets

Start with these presets:

```ts
const STYLE_PRESETS = [
  {
    id: "pixel-art",
    name: "Pixel Art",
    prompt: "crisp pixel art game sprite, limited palette, clean silhouette, readable small-scale forms, nearest-neighbor aesthetic",
  },
  {
    id: "snes-rpg",
    name: "SNES RPG",
    prompt: "16-bit SNES RPG-style sprite, colorful fantasy game asset, clean clusters, readable outline, limited detail",
  },
  {
    id: "gba-rpg",
    name: "GBA RPG",
    prompt: "Game Boy Advance RPG-style sprite, bright readable colors, compact proportions, clean game-ready shading",
  },
  {
    id: "dark-fantasy",
    name: "Dark Fantasy",
    prompt: "dark fantasy 2D game sprite, moody palette, readable silhouette, stylized armor or creature detail, game asset style",
  },
  {
    id: "cute-chibi",
    name: "Cute Chibi",
    prompt: "cute chibi 2D game sprite, simplified proportions, expressive shape language, clean readable design",
  },
  {
    id: "monochrome-1bit",
    name: "1-bit Monochrome",
    prompt: "1-bit monochrome pixel art sprite, black and white only, strong silhouette, clean dithering, retro handheld style",
  }
];
```

## Target Sprite Sizes

Initial supported sizes:

```txt
16x16
24x24
32x32
48x48
64x64
96x96
128x128
```

Represent dimensions as width and height, not a single size value, but the initial UI may only expose square presets.

## Sharp Processing Requirements

All generated outputs must pass through Sharp before being stored as final sprites.

Initial processing pipeline:

1. Decode generated base64 data URL.
2. Normalize to PNG.
3. Resize into requested target canvas.
4. Use `fit: "contain"`.
5. Use transparent padding.
6. Use `kernel: "nearest"` for pixel-art presets.
7. Preserve alpha where present.
8. Store final PNG.
9. Generate a larger nearest-neighbor preview PNG for UI display.

Do not rely on the model to produce the exact final dimensions.

The final exported sprite must be the requested target dimensions.

Preview images may be larger, for example 512x512.

## Storage Model

Use local filesystem storage for binary files.

Suggested structure:

```txt
data/
  sprite-forge.sqlite
  storage/
    uploads/
      {uploadId}.png
    jobs/
      {jobId}/
        source.png
        variants/
          {variantId}.png
          {variantId}.preview.png
        exports/
          all-variants.zip
```

Do not store large image blobs in SQLite.

SQLite should store paths, metadata, settings, prompts, statuses, and timestamps.

## Database Schema

Use Drizzle migrations.

Initial tables:

### uploads

Fields:

* id
* original_filename
* mime_type
* size_bytes
* width
* height
* storage_path
* created_at

### generation_jobs

Fields:

* id
* upload_id
* status
* model
* user_prompt
* style_preset_id
* style_prompt
* target_width
* target_height
* variant_count
* background_mode
* created_at
* started_at
* completed_at
* failed_at
* error_message

Status values:

```txt
queued
running
completed
failed
cancelled
```

For the MVP, jobs can run synchronously inside the request, but still persist status as if async execution may be added later.

### generated_variants

Fields:

* id
* job_id
* status
* variant_index
* variant_direction
* model
* raw_image_path
* final_image_path
* preview_image_path
* width
* height
* openrouter_response_json
* error_message
* created_at
* completed_at
* failed_at

Status values:

```txt
running
completed
failed
```

## API Routes

Implement these Nitro server routes:

```txt
POST   /api/uploads
GET    /api/uploads/:id

POST   /api/generation-jobs
GET    /api/generation-jobs
GET    /api/generation-jobs/:id

GET    /api/generation-jobs/:id/download.zip
GET    /api/variants/:id/image.png
GET    /api/variants/:id/preview.png
GET    /api/variants/:id/download.png

GET    /api/settings
```

For the MVP, `POST /api/generation-jobs` may block until all variants are generated. Keep the implementation structured so it can later be moved to a background worker.

## UI Pages

Create these pages:

```txt
/
  Main generation workspace.

 /jobs
  Local generation history.

 /jobs/[id]
  Job detail page with source image, prompt/settings, generated variants, and export actions.

 /settings
  Local settings page for default model, default output size, and storage diagnostics.
```

## Main Workspace UI

The home page should include:

* Source image uploader.
* Source image preview.
* Prompt textarea.
* Style preset selector.
* Output size selector.
* Variant count selector.
* Model display.
* Generate button.
* Generated candidate grid.
* Per-candidate PNG download button.
* Download all ZIP button.

Keep the UI simple and functional. Avoid elaborate design systems in the first pass.

Tailwind CSS is acceptable. Avoid adding a heavy component framework unless necessary.

## Error Handling

Surface clear errors for:

* Missing `OPENROUTER_API_KEY`.
* Unsupported image file type.
* Upload too large.
* OpenRouter API failure.
* No image returned by model.
* Invalid generated image data URL.
* Sharp processing failure.
* SQLite migration failure.
* Filesystem write failure.

Errors should be visible in the UI and logged server-side.

## Validation Rules

Initial upload constraints:

```txt
Allowed types:
- image/png
- image/jpeg
- image/webp

Max file size:
- 10 MB

Recommended source dimensions:
- Any, but display a warning for images larger than 2048x2048.
```

Generation constraints:

```txt
variant_count must be 4, 5, or 6
target_width must be one of supported sizes
target_height must be one of supported sizes
prompt max length: 2000 chars
style_preset_id must exist
```

Use Zod for request validation.

## Development Commands

<!-- fallow:setup-hooks:start -->
## Fallow local gate

Before any `git commit` or `git push`, run `fallow audit --format json --quiet --explain --gate-marker agent`. If the verdict is `fail`, fix the reported findings before retrying. Treat JSON runtime errors like `{ "error": true, ... }` as non-blocking.

Audit defaults to `gate=new-only`: only findings introduced by the current changeset affect the verdict. Inherited findings on touched files are reported under `attribution` and annotated with `introduced: false`, but do not block the commit. Set `[audit] gate = "all"` in `fallow.toml` to gate every finding in changed files.

For non-skill agents, treat the task map below as the local onboarding source: run the listed fallow command before destructive edits, before commits, and before pull request handoff.

## Fallow task map

| When the agent is about to... | Run |
|---|---|
| delete an "unused" export or file | `fallow dead-code --trace <file>:<export>` |
| delete an "unused" dependency | `fallow dead-code --trace-dependency <name>` |
| commit or open a PR | `fallow audit --base <ref>` |
| prioritize refactoring | `fallow health --hotspots --targets` |
| ask who owns code | `fallow health --ownership` |
| check untested-but-reachable code | `fallow health --coverage-gaps` |
| consolidate duplication | `fallow dupes --trace dup:<fingerprint>` |
| find feature flags | `fallow flags` |
| surface security candidates | `fallow security` |
| understand a finding | `fallow explain <issue-type>` |
| scope a monorepo | `--workspace <glob> / --changed-workspaces <ref>` (global flags, prefix any command) |
<!-- fallow:setup-hooks:end -->

Prefer these commands:

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

Add scripts to `package.json` as needed.

## Coding Standards

Use:

* TypeScript strict mode.
* Explicit server-side validation.
* Small composables and utilities.
* Clear domain names: `generationJob`, `variant`, `upload`, `sprite`.
* No hidden global state for job execution.
* No client-side access to `OPENROUTER_API_KEY`.
* No browser-only image processing for final outputs.
* No untyped API responses.

Avoid:

* Auth.
* Payments.
* Cloud uploads.
* S3.
* Redis.
* Docker requirement for local development.
* Premature background worker architecture.
* Overly generic AI abstraction layers.
* Generating sprite sheets before still sprite generation works well.

## File Organization

Suggested structure:

```txt
app/
  pages/
    index.vue
    jobs/
      index.vue
      [id].vue
    settings.vue
  components/
    SourceUploader.vue
    StylePresetSelect.vue
    SpriteSizeSelect.vue
    VariantCountSelect.vue
    GeneratedVariantGrid.vue
    JobStatusBadge.vue
  composables/
    useGenerationJobs.ts
    useUploads.ts

server/
  api/
    uploads.post.ts
    uploads/[id].get.ts
    generation-jobs/index.get.ts
    generation-jobs/index.post.ts
    generation-jobs/[id].get.ts
    generation-jobs/[id]/download.zip.get.ts
    variants/[id]/image.png.get.ts
    variants/[id]/preview.png.get.ts
    variants/[id]/download.png.get.ts
    settings.get.ts
  db/
    client.ts
    schema.ts
    migrations/
  services/
    openrouter.ts
    generation-jobs.ts
    image-processing.ts
    storage.ts
    zip-export.ts
    style-presets.ts
  utils/
    data-url.ts
    errors.ts
```

## Testing Expectations

Add tests where they are cheap and valuable.

Priority tests:

* Prompt builder output.
* Data URL parsing.
* Upload validation.
* Sharp resize behavior.
* ZIP export includes expected files.
* Database insert/read for jobs and variants.

Do not spend time mocking the full OpenRouter image API for the first pass unless the app structure requires it.

## Acceptance Criteria for MVP

The MVP is complete when:

1. The app starts locally with `pnpm dev`.
2. The only required secret is `OPENROUTER_API_KEY`.
3. A user can upload a sprite image.
4. A user can enter a prompt and select a style preset.
5. A user can generate 4-6 variants.
6. Generated variants are visible in the UI.
7. Final PNG files are saved locally.
8. Each final PNG has the selected target dimensions.
9. A user can download one variant as PNG.
10. A user can download all variants as ZIP.
11. Jobs and variants persist in SQLite.
12. Previous jobs can be viewed after restarting the app.
13. OpenRouter and image-processing errors are visible and diagnosable.

## Implementation Order

Build in this order:

1. Nuxt app scaffold.
2. Runtime config and environment validation.
3. SQLite + Drizzle setup.
4. Local storage service.
5. Upload endpoint.
6. Upload UI.
7. Style presets and prompt builder.
8. OpenRouter service.
9. Sharp image processing service.
10. Generation job endpoint.
11. Main generation UI.
12. Job detail page.
13. PNG download endpoints.
14. ZIP export endpoint.
15. Job history page.
16. Settings page.
17. Basic tests.
18. README with local setup.

## Notes for Codex

Prefer making working vertical slices over broad skeletons.

After each implementation pass:

* Run typecheck.
* Run lint if configured.
* Run tests if configured.
* Fix generated code that fails locally.
* Keep changes small and inspectable.
* Do not add features outside this file and ROADMAP.md unless required to make the MVP function.

When uncertain, choose the simplest local-first implementation.

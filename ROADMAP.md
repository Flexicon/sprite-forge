# ROADMAP.md

# Sprite Forge Roadmap

## Product Goal

Create a self-hosted Nuxt app that converts uploaded 2D sprite images into 4-6 generated sprite variants using OpenRouter image models, then post-processes the results into clean PNG assets suitable for game development.

The initial target is still-image sprite generation. Sprite sheets, animation, palette tools, and batch workflows come later.

## Guiding Constraints

* Local-first.
* No auth.
* No cloud storage.
* No SaaS assumptions.
* SQLite only.
* Filesystem image storage.
* OpenRouter for generation.
* Sharp for final asset processing.
* Simple UI over polished UI.
* Real PNG output over pretty previews.
* One uploaded source image per generation job in MVP.
* One generated sprite per model call.

## Phase 0 — Project Bootstrap

### Goal

Create a runnable Nuxt + TypeScript project with the basic local development foundation.

### Tasks

* Create Nuxt project.
* Add TypeScript strict mode.
* Add pnpm scripts.
* Add Tailwind CSS if not already present.
* Add ESLint.
* Add runtime config.
* Add environment variable validation.
* Add `/data` directory convention.
* Add basic home page shell.
* Add README setup notes.

### Required scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
```

### Acceptance Criteria

* `pnpm install` works.
* `pnpm dev` starts the app.
* App renders a basic page.
* Missing `OPENROUTER_API_KEY` is reported clearly when generation is attempted, not during unrelated browsing.

## Phase 1 — SQLite + Drizzle

### Goal

Persist uploads, generation jobs, and generated variants.

### Tasks

* Install Drizzle.
* Configure SQLite.
* Add schema.
* Add migrations.
* Add database client.
* Add migration command.
* Add simple database health check.

### Tables

* `uploads`
* `generation_jobs`
* `generated_variants`

### Commands

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

### Acceptance Criteria

* Database file is created under `data/`.
* Migrations run cleanly.
* App can insert and read a test row during development.
* Schema matches the entities in `AGENTS.md`.

## Phase 2 — Local Storage Service

### Goal

Create predictable local filesystem storage for uploads and generated images.

### Tasks

* Implement `server/services/storage.ts`.
* Resolve `STORAGE_DIR`.
* Ensure directories exist on boot or first write.
* Add safe path helpers.
* Prevent path traversal.
* Add helper for writing buffers.
* Add helper for reading files.
* Add helper for checking file existence.

### Storage Layout

```txt
data/storage/
  uploads/
  jobs/
```

### Acceptance Criteria

* App can write and read an uploaded file.
* Storage paths saved in SQLite are relative paths.
* API never accepts arbitrary filesystem paths from the client.

## Phase 3 — Upload Flow

### Goal

Allow users to upload a source image and preview it.

### Tasks

* Implement `POST /api/uploads`.
* Implement `GET /api/uploads/:id`.
* Validate file type.
* Validate file size.
* Extract image metadata with Sharp.
* Store the original image.
* Normalize upload to PNG if useful.
* Create upload record in SQLite.
* Build `SourceUploader.vue`.
* Show source preview in UI.

### Supported Types

```txt
image/png
image/jpeg
image/webp
```

### Acceptance Criteria

* User can upload PNG/JPEG/WebP.
* User sees preview after upload.
* Upload metadata is persisted.
* Invalid files produce readable errors.

## Phase 4 — Style Presets + Prompt Builder

### Goal

Create deterministic prompt construction before touching OpenRouter generation.

### Tasks

* Add `server/services/style-presets.ts`.
* Add style preset list.
* Add prompt builder.
* Add variant direction builder.
* Add Zod validation for generation inputs.
* Add unit tests for prompt output.

### Initial Presets

* Pixel Art
* SNES RPG
* GBA RPG
* Dark Fantasy
* Cute Chibi
* 1-bit Monochrome

### Acceptance Criteria

* Prompt builder returns stable structured text.
* Each variant receives a different variant direction.
* Invalid style preset IDs are rejected.

## Phase 5 — OpenRouter Service

### Goal

Generate one image from one uploaded image and one prompt.

### Tasks

* Implement `server/services/openrouter.ts`.
* Read `OPENROUTER_API_KEY` from server runtime config.
* Read `OPENROUTER_DEFAULT_MODEL`.
* Convert uploaded image to base64 data URL.
* Send image + prompt to OpenRouter.
* Request image output using `modalities: ["image", "text"]`.
* Parse returned image data URL.
* Store raw response metadata for debugging.
* Add clear error types.

### Default Model

```txt
google/gemini-2.5-flash-image
```

### Optional Model Override

Support this through env:

```env
OPENROUTER_DEFAULT_MODEL=google/gemini-3.1-flash-image-preview
```

### Acceptance Criteria

* Service can generate a single image from a source upload.
* Missing API key error is clear.
* No API key is exposed to client code.
* No generated image response is treated as failure.
* Raw model response metadata can be persisted.

## Phase 6 — Sharp Post-Processing

### Goal

Convert generated model output into real game-asset PNG files.

### Tasks

* Implement `server/services/image-processing.ts`.
* Decode generated data URLs.
* Normalize to PNG.
* Resize final sprite to target dimensions.
* Use transparent padding.
* Use nearest-neighbor resizing for pixel-art-like presets.
* Generate large preview image.
* Store raw generated image.
* Store final sprite PNG.
* Store preview PNG.

### Final Sprite Rules

* Final PNG dimensions must exactly match selected target width and height.
* Preserve alpha when available.
* Use transparent background for padding.
* Do not upscale final output beyond target dimensions.
* Preview output may be upscaled.

### Acceptance Criteria

* Given any generated image, app creates:

  * raw PNG
  * final target-size PNG
  * preview PNG
* Final PNG dimensions are correct.
* Preview is large enough to inspect in UI.

## Phase 7 — Generation Job Endpoint

### Goal

Generate 4-6 sprite variants from one uploaded image.

### Tasks

* Implement `POST /api/generation-jobs`.
* Validate input.
* Create generation job record.
* Mark job as running.
* Generate variants sequentially first.
* Persist each variant result.
* Mark job completed or failed.
* Return full job payload.

### Why Sequential First

Parallel generation can come later. Sequential execution is easier to debug and avoids rate-limit ambiguity during MVP development.

### Input Shape

```ts
type CreateGenerationJobInput = {
  uploadId: string;
  userPrompt: string;
  stylePresetId: string;
  targetWidth: number;
  targetHeight: number;
  variantCount: 4 | 5 | 6;
  backgroundMode: "transparent" | "plain";
};
```

### Acceptance Criteria

* Endpoint creates one job.
* Endpoint generates requested number of variants.
* Variant failures are recorded.
* Successful variants remain available even if one variant fails.
* Job status is accurate.
* Response includes generated variant IDs and preview URLs.

## Phase 8 — Main Generation UI

### Goal

Make the app usable from the browser.

### Tasks

* Build main page layout.
* Add upload widget.
* Add prompt textarea.
* Add style preset selector.
* Add target size selector.
* Add variant count selector.
* Add generate button.
* Add loading state.
* Add error display.
* Add generated variants grid.
* Add per-variant download button.
* Add link to job detail page.

### Acceptance Criteria

* User can complete the full upload → generate → preview → download loop from `/`.
* UI handles slow generation without appearing broken.
* Errors are visible and useful.

## Phase 9 — Image Serving + Downloads

### Goal

Serve generated assets back to the browser and support exports.

### Tasks

* Implement `GET /api/variants/:id/image.png`.
* Implement `GET /api/variants/:id/preview.png`.
* Implement `GET /api/variants/:id/download.png`.
* Implement `GET /api/generation-jobs/:id/download.zip`.
* Add ZIP generation service.
* Include useful filenames in downloads.

### Filename Format

```txt
sprite-forge-{jobId}-variant-{index}-{width}x{height}.png
```

ZIP format:

```txt
sprite-forge-{jobId}.zip
```

ZIP contents:

```txt
variant-1.png
variant-2.png
variant-3.png
variant-4.png
metadata.json
```

### Acceptance Criteria

* Individual PNG download works.
* ZIP download works.
* ZIP contains all completed variants.
* ZIP contains metadata JSON.
* Failed variants are excluded from ZIP but listed in metadata.

## Phase 10 — Job History

### Goal

Allow users to view previous local generations.

### Tasks

* Implement `GET /api/generation-jobs`.
* Implement `GET /api/generation-jobs/:id`.
* Build `/jobs`.
* Build `/jobs/[id]`.
* Show source image.
* Show prompt/settings.
* Show generated variants.
* Show status and errors.
* Show download buttons.

### Acceptance Criteria

* Restarting the app does not lose job history.
* User can browse old jobs.
* User can download old variants.
* Failed jobs are inspectable.

## Phase 11 — Settings Page

### Goal

Expose simple local diagnostics and defaults.

### Tasks

* Implement `GET /api/settings`.
* Build `/settings`.
* Show configured model.
* Show storage path.
* Show database path.
* Show whether OpenRouter API key is configured.
* Show supported output sizes.
* Show available style presets.

### Acceptance Criteria

* User can verify local configuration from the browser.
* API key value is never displayed.
* Settings page helps diagnose common local setup issues.

## Phase 12 — Basic Tests

### Goal

Protect the most failure-prone utility code.

### Tasks

Add tests for:

* Data URL parsing.
* Prompt building.
* Style preset lookup.
* Generation input validation.
* Sharp output dimensions.
* ZIP export contents.
* Storage path safety.

### Acceptance Criteria

* Tests run with one command.
* Tests do not require OpenRouter API access.
* Tests do not depend on external network access.

## Phase 13 — README Polish

### Goal

Make the project easy to start on the local server.

### Tasks

Document:

* Requirements.
* Installation.
* Environment variables.
* Database migration.
* Running dev server.
* Running production build.
* Storage directory.
* OpenRouter model config.
* Known limitations.
* Troubleshooting.

### Minimum Setup Docs

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

### Acceptance Criteria

* A fresh checkout can be configured from README alone.
* Required environment variables are documented.
* Common errors are explained.

## Post-MVP Ideas

Do not implement these before the MVP is working.

### Sprite Sheets

* Generate walking cycles.
* Generate idle animations.
* Export horizontal sprite strips.
* Export grid sprite sheets.
* Export Aseprite-compatible metadata JSON.

### Palette Tools

* Palette reduction.
* User-defined palette.
* DawnBringer palette presets.
* Game Boy palette presets.
* NES-like palette constraints.

### Better Background Handling

* Automatic background removal.
* Chroma-key cleanup.
* Alpha matte cleanup.
* Manual background color picker.

### Better Pixel Art Processing

* Pixel clustering.
* Dithering modes.
* Outline cleanup.
* Stray pixel cleanup.
* Optional indexed PNG export.

### Batch Mode

* Upload multiple source sprites.
* Apply same prompt/settings to all.
* Batch ZIP export.

### Model Comparison Mode

* Generate same prompt across multiple OpenRouter models.
* Compare Nano Banana, Nano Banana Pro, Seedream, Recraft, and other image models.
* Save model preference per style preset.

### Local Worker

* Move generation to a background worker.
* Add progress updates.
* Add cancellation.
* Add retry behavior.
* Add rate-limit backoff.

### Project Library

* Tag jobs.
* Favorite variants.
* Rename outputs.
* Add notes.
* Delete old jobs and files.

## MVP Definition of Done

MVP is done when this works:

1. Start app locally.
2. Upload a source sprite.
3. Enter prompt.
4. Choose style preset.
5. Choose target size.
6. Choose 4-6 variants.
7. Generate through OpenRouter.
8. See generated previews.
9. Download individual PNG.
10. Download ZIP of all completed variants.
11. Restart app.
12. View previous job history.
13. Download old outputs.

Anything beyond that is post-MVP.


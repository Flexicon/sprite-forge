# Sprite Forge Roadmap

## Product Goal

Sprite Forge is a local-first Nuxt app for generating, processing, reviewing, and exporting 2D game sprites. The MVP uses OpenRouter image models to create 1-3 sprite variants, Sharp to normalize outputs into clean PNG assets, SQLite for local metadata, and local filesystem storage for uploads and generated images.

The next product goal is to add a simple built-in pixel editor so generated sprites can be lightly touched up without leaving the app.

## Current MVP Summary

Status: completed

The app currently supports:

* Uploading PNG, JPEG, and WebP source images.
* Creating new sprites from either an uploaded source image or a prompt-only workflow.
* Entering a freeform prompt.
* Choosing a style preset.
* Choosing a target sprite size.
* Choosing 1, 2, or 3 variants, with 2 as the default.
* Generating each variant through a separate OpenRouter image request.
* Persisting uploads, generation jobs, and generated variants in SQLite.
* Storing binary image files on the local filesystem.
* Processing generated images with Sharp into final target-size PNG files.
* Creating larger pixelated preview PNGs for inspection in the UI.
* Browsing generation history after restart.
* Viewing job details, source image, prompt/settings, status, errors, and generated variants.
* Downloading individual generated sprites as PNG.
* Downloading all completed variants for a job as a ZIP with metadata.
* Viewing local settings and diagnostics.
* Running basic tests for critical utility and processing behavior.

## Guiding Constraints

* Keep the app local-first.
* Do not add auth, billing, cloud storage, Redis, queues, or SaaS assumptions.
* Keep generated outputs immutable unless there is an explicit overwrite feature later.
* Prefer small vertical slices over broad abstractions.
* Prefer plain Vue and browser APIs before adding editor libraries.
* Preserve real PNG outputs over UI-only previews.

## Sprite Editor Scope

The editor should solve one concrete problem: fixing a few stray pixels after generation.

Initial editor features:

* Open a completed generated variant.
* Open a direct image upload.
* Pencil tool.
* Eraser tool for transparent pixels.
* Eyedropper tool.
* Color picker.
* Small brush sizes, likely 1, 2, and 4 pixels.
* Undo and redo.
* Zoom controls.
* Grid toggle.
* Transparency checkerboard.
* Download edited PNG.
* Save edited copy locally.

Out of scope for the first editor pass:

* Layers.
* Selection tools.
* Flood fill.
* Animation frames.
* Tilemaps.
* Sprite sheets.
* Palette file management.
* Advanced transforms.
* Replacing original generated files by default.

## Phase 1 - Editor Page Shell

Status: completed

### Goal

Add a dedicated `/editor` page and make it easy to reach from the existing app.

### Tasks

* Add an `Editor` nav link next to workspace, history, and settings links.
* Create `/editor` page.
* Support opening a generated variant with `variantId` query param.
* Support opening an upload with `uploadId` query param.
* Load generated variant images from `/api/variants/:id/image.png`.
* Load upload images from `/api/uploads/:id/image.png`.
* Show an empty state with direct upload affordance when no image is selected.
* Add an `Edit` button for completed generated variants.

### Acceptance Criteria

* User can navigate to `/editor` from the main app.
* User can click `Edit` from a completed generated variant and see that sprite in the editor.
* User can upload an image directly on the editor page and see it loaded.
* The source image is shown pixelated and sized for inspection.

## Phase 2 - Canvas Editing MVP

Status: next

### Goal

Implement the minimum useful pixel-touchup workflow in the browser.

### Tasks

* Render the loaded image into an editable canvas.
* Keep editable image data at natural sprite dimensions.
* Render a scaled pixelated preview canvas.
* Map pointer coordinates to sprite pixel coordinates.
* Add pencil tool.
* Add eraser tool that writes transparent pixels.
* Add eyedropper tool.
* Add color picker.
* Add brush size selector.
* Add PNG download from the edited canvas.

### Acceptance Criteria

* User can change individual pixels accurately.
* User can erase to transparency.
* User can sample a color from the sprite.
* User can download the edited image as a PNG.
* Downloaded PNG keeps the source image dimensions.

## Phase 3 - Editor Ergonomics

Status: pending

### Goal

Make small pixel edits comfortable enough for real use.

### Tasks

* Add undo and redo with a bounded history.
* Add zoom controls.
* Add grid toggle.
* Add transparency checkerboard behind the canvas.
* Add visible current tool/color/brush status.
* Add basic keyboard shortcuts if they stay simple.

### Acceptance Criteria

* User can recover from accidental edits with undo.
* User can zoom in far enough for 16x16 and 32x32 sprites.
* Grid and checkerboard make transparent and individual pixels clear.
* Editing still works on desktop and narrow screens.

## Phase 4 - Persist Edited Sprites

Status: pending

### Goal

Save edited sprites locally without mutating the original generated variant or upload.

### Data Model

Add a `sprite_edits` table:

```txt
id
source_type: variant | upload | edit
source_id
width
height
storage_path
created_at
```

### Storage Layout

```txt
data/storage/
  edits/
    {editId}.png
```

### API Routes

```txt
POST /api/sprite-edits
GET  /api/sprite-edits
GET  /api/sprite-edits/:id
GET  /api/sprite-edits/:id/image.png
GET  /api/sprite-edits/:id/download.png
```

### Tasks

* Add Drizzle schema and migration for `sprite_edits`.
* Add storage helper for edit paths.
* Add server-side PNG validation and normalization with Sharp.
* Enforce a reasonable maximum editable image size.
* Save edited PNG files under `edits/`.
* Insert edit metadata in SQLite.
* Add save action in the editor UI.
* Add download endpoint with useful filename.

### Acceptance Criteria

* Saving creates a new edited artifact.
* Saving never overwrites the source upload or generated variant.
* Saved edits survive app restart.
* Saved edits can be reopened and downloaded.
* Invalid edited image payloads produce clear errors.

## Phase 5 - Saved Edits Library

Status: pending

### Goal

Make saved edits discoverable and reusable.

### Tasks

* Show recent saved edits on `/editor`.
* Add `Open` and `Download` actions for saved edits.
* Consider showing saved edits on the related job detail page when the source is a variant.
* Consider adding a lightweight `/edits` or history filter only if `/editor` becomes crowded.

### Acceptance Criteria

* User can find recently saved edits without remembering file paths.
* User can reopen a saved edit for more touchup work.
* User can download saved edits from the UI.

## Phase 6 - Polish And Tests

Status: pending

### Goal

Harden the editor enough for regular local use.

### Tasks

* Add tests for server-side edited PNG validation.
* Add tests for `sprite_edits` insert/read behavior where practical.
* Add tests for edit storage path safety.
* Verify typecheck, lint, and test commands.
* Document the editor workflow in README.
* Revisit whether a shared app nav component is worthwhile after editor navigation exists.

### Acceptance Criteria

* `pnpm typecheck` passes.
* `pnpm lint` passes.
* `pnpm test` passes.
* README explains how generated sprites can be edited and saved.

## Later Ideas

Do not implement these before the simple editor is useful.

* Replace generated variant final PNG intentionally, with confirmation.
* Palette reduction.
* User-defined palettes.
* Flood fill.
* Selection and move tools.
* Resize or crop tools.
* Sprite sheet export.
* Animation frames.
* Batch editing.
* Model comparison mode.
* Background generation worker.
* Favorites, tags, notes, and project-library organization.

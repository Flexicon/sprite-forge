# Sprite Forge

Sprite Forge is a local-first Nuxt app for transforming uploaded 2D game sprite images into generated sprite variants. The MVP targets still-image generation through OpenRouter, Sharp-based PNG post-processing, SQLite metadata, and local filesystem storage.

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- An OpenRouter API key for generation

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://localhost:3674` after the dev server starts.

## Environment

Required for generation:

```env
OPENROUTER_API_KEY=
```

Defaults used by the app:

```env
DATABASE_URL=file:./data/sprite-forge.sqlite
STORAGE_DIR=./data/storage
OPENROUTER_DEFAULT_MODEL=google/gemini-2.5-flash-image
```

Optional OpenRouter metadata:

```env
OPENROUTER_SITE_URL=http://localhost:3674
OPENROUTER_APP_NAME=Sprite Forge
```

The app should report a missing `OPENROUTER_API_KEY` when generation is attempted, not during normal browsing.

## Sprite Editor

Open `/editor` from the app navigation to touch up sprites locally in the browser. You can start from a completed generated variant by clicking its `Edit` action, open a saved edit from the recent edits library, or upload a PNG directly on the editor page.

The editor keeps the working canvas at the source image dimensions and provides pencil, eraser, eyedropper, brush-size, zoom, grid, checkerboard, undo, and redo controls. `Download PNG` exports the current canvas immediately without saving metadata.

Use `Save edited copy` to persist the edited PNG on the local filesystem as a new artifact. Saving never overwrites the original upload, generated variant, or earlier edit. Saved edits appear in the recent edits list on `/editor`, can be reopened for more touchup work, and can be downloaded from the UI.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
```

Database scripts:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Local Data

Runtime data belongs under `data/` and is ignored by git except for directory placeholders.

```txt
data/
  sprite-forge.sqlite
  storage/
```

Run `pnpm db:migrate` to create or update `data/sprite-forge.sqlite`.
The `GET /api/settings` endpoint includes database and storage health checks. The database check verifies an insert/read inside a rolled-back savepoint, and the storage check verifies local write/read/delete access under `STORAGE_DIR`.

## Current Status

The MVP generation workflow and built-in pixel editor are complete through the editor hardening phase. The app supports local sprite generation, persisted uploads/jobs/variants, PNG/ZIP exports, saved editor copies, and basic tests for core server utilities.

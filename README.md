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

Open `http://localhost:4179` after the dev server starts.

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
OPENROUTER_SITE_URL=http://localhost:4179
OPENROUTER_APP_NAME=Sprite Forge
```

The app should report a missing `OPENROUTER_API_KEY` when generation is attempted, not during normal browsing.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
```

Database scripts will be added with the Drizzle setup phase.
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

Phase 2 is complete: Nuxt bootstrap, SQLite/Drizzle persistence, and a safe local storage service with settings diagnostics.

import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '../server/db/schema'
import { spriteEdits } from '../server/db/schema'

let sqlite: Database.Database

function createSpriteEditsTable() {
  sqlite.exec(`
    CREATE TABLE sprite_edits (
      id text PRIMARY KEY NOT NULL,
      source_type text NOT NULL,
      source_id text NOT NULL,
      width integer NOT NULL,
      height integer NOT NULL,
      storage_path text NOT NULL,
      created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE INDEX sprite_edits_source_idx ON sprite_edits (source_type, source_id);
    CREATE INDEX sprite_edits_created_at_idx ON sprite_edits (created_at);
  `)
}

beforeEach(() => {
  sqlite = new Database(':memory:')
  createSpriteEditsTable()
})

afterEach(() => {
  sqlite.close()
})

describe('sprite_edits persistence', () => {
  it('inserts and reads saved edit metadata', async () => {
    const db = drizzle(sqlite, { schema })

    const [inserted] = await db.insert(spriteEdits).values({
      id: 'edit-1',
      sourceType: 'variant',
      sourceId: 'variant-1',
      width: 32,
      height: 24,
      storagePath: 'edits/edit-1.png',
    }).returning()

    const stored = await db.query.spriteEdits.findFirst({
      where: eq(spriteEdits.id, 'edit-1'),
    })

    expect(inserted).toMatchObject({
      id: 'edit-1',
      sourceType: 'variant',
      sourceId: 'variant-1',
      width: 32,
      height: 24,
      storagePath: 'edits/edit-1.png',
    })
    expect(stored).toEqual(inserted)
    expect(stored?.createdAt).toEqual(expect.any(String))
  })
})

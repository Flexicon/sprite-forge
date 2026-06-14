import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'

import * as schema from './schema'

function getDatabaseUrl() {
  try {
    return useRuntimeConfig().databaseUrl
  }
  catch {
    return process.env.DATABASE_URL || 'file:./data/sprite-forge.sqlite'
  }
}

export function getDatabasePath() {
  const databaseUrl = getDatabaseUrl()
  const rawPath = databaseUrl.startsWith('file:') ? databaseUrl.slice('file:'.length) : databaseUrl

  return resolve(process.cwd(), rawPath)
}

const databasePath = getDatabasePath()
mkdirSync(dirname(databasePath), { recursive: true })

const sqlite = new Database(databasePath)
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

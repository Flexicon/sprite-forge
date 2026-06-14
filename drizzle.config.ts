import { defineConfig } from 'drizzle-kit'

function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL || 'file:./data/sprite-forge.sqlite'

  return databaseUrl.startsWith('file:') ? databaseUrl.slice('file:'.length) : databaseUrl
}

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolveDatabasePath(),
  },
})

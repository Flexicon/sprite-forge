import { sql } from 'drizzle-orm'

import { db, getDatabasePath } from './client'
import { uploads } from './schema'

export async function checkDatabaseHealth() {
  const testId = `health-${crypto.randomUUID()}`

  db.run(sql`SAVEPOINT db_health_check`)

  try {
    await db.insert(uploads).values({
      id: testId,
      originalFilename: 'health-check.png',
      mimeType: 'image/png',
      sizeBytes: 0,
      width: 1,
      height: 1,
      storagePath: 'health-check.png',
    })

    const [row] = await db.select({ id: uploads.id }).from(uploads).where(sql`${uploads.id} = ${testId}`).limit(1)

    return {
      ok: row?.id === testId,
      path: getDatabasePath(),
    }
  }
  finally {
    db.run(sql`ROLLBACK TO SAVEPOINT db_health_check`)
    db.run(sql`RELEASE SAVEPOINT db_health_check`)
  }
}

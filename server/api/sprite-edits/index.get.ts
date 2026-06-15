import { desc } from 'drizzle-orm'

import { db } from '../../db/client'
import { spriteEdits } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.max(1, Math.min(Number(query.limit) || 100, 100))

  const edits = await db.query.spriteEdits.findMany({
    orderBy: [desc(spriteEdits.createdAt)],
    limit,
  })

  return { edits }
})

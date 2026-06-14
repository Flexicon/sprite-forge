import { desc } from 'drizzle-orm'

import { db } from '../../db/client'
import { generationJobs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lite = query.lite === '1' || query.lite === 'true'
  const limit = Math.min(Number(query.limit) || 100, 100)

  const jobs = await db.query.generationJobs.findMany({
    orderBy: [desc(generationJobs.createdAt)],
    with: lite ? undefined : { variants: true, upload: true },
    limit,
  })

  return { jobs }
})

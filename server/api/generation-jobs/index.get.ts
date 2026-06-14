import { desc } from 'drizzle-orm'

import { db } from '../../db/client'
import { generationJobs } from '../../db/schema'

export default defineEventHandler(async () => {
  const jobs = await db.query.generationJobs.findMany({
    orderBy: [desc(generationJobs.createdAt)],
    with: { variants: true, upload: true },
    limit: 100,
  })

  return { jobs }
})

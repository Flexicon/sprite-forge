import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { generationJobs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job ID is required.' })
  }

  const job = await db.query.generationJobs.findFirst({
    where: eq(generationJobs.id, id),
    with: { variants: true, upload: true },
  })

  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found.' })
  }

  return { job }
})

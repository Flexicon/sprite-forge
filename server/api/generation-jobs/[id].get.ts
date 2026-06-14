import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { generationJobs } from '../../db/schema'
import { getJobById } from '../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const job = await getJobById(id!)

  // Re-fetch with upload relation for full response
  const jobWithUpload = await db.query.generationJobs.findFirst({
    where: eq(generationJobs.id, job.id),
    with: { variants: true, upload: true },
  })

  return { job: jobWithUpload }
})

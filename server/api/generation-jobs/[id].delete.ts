import { eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { generationJobs, uploads } from '../../db/schema'
import { storage } from '../../services/storage'
import { getJobById } from '../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const job = await getJobById(id!)

  await db.delete(generationJobs).where(eq(generationJobs.id, job.id))

  const remainingUploadJobs = await db.select({ id: generationJobs.id })
    .from(generationJobs)
    .where(eq(generationJobs.uploadId, job.uploadId))
    .limit(1)

  const deletedUpload = remainingUploadJobs.length === 0
  if (deletedUpload) {
    await db.delete(uploads).where(eq(uploads.id, job.uploadId))
  }

  await storage.remove(storage.jobPath(job.id))
  if (deletedUpload && job.upload) {
    await storage.remove(job.upload.storagePath)
  }

  return { deleted: true, deletedUpload }
})

import { eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { generationJobs, uploads } from '../../db/schema'
import { storage } from '../../services/storage'
import { getJobById } from '../../utils/api-helpers'

async function deleteUploadIfUnused(uploadId: string) {
  const remainingUploadJobs = await db.select({ id: generationJobs.id })
    .from(generationJobs)
    .where(eq(generationJobs.uploadId, uploadId))
    .limit(1)

  if (remainingUploadJobs.length > 0) {
    return false
  }

  await db.delete(uploads).where(eq(uploads.id, uploadId))
  return true
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const job = await getJobById(id!)

  await db.delete(generationJobs).where(eq(generationJobs.id, job.id))

  let deletedUpload = false
  if (job.uploadId) {
    deletedUpload = await deleteUploadIfUnused(job.uploadId)
  }

  await storage.remove(storage.jobPath(job.id))
  if (deletedUpload) {
    if (job.upload) {
      await storage.remove(job.upload.storagePath)
    }
  }

  return { deleted: true, deletedUpload }
})

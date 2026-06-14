import { eq } from 'drizzle-orm'
import { db } from '../../../db/client'
import { generationJobs } from '../../../db/schema'
import { readFileOrNotFound } from '../../../utils/storage-helpers'
import { getVariantById } from '../../../utils/api-helpers'

// fallow-ignore-next-line complexity
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const variant = await getVariantById(id!)

  if (!variant.finalImagePath) {
    throw createError({ statusCode: 404, statusMessage: 'Variant not found.' })
  }

  const job = await db.query.generationJobs.findFirst({
    where: eq(generationJobs.id, variant.jobId),
  })

  const buffer = await readFileOrNotFound(variant.finalImagePath)

  const jobId = job?.id ?? 'unknown'
  const width = job?.targetWidth ?? 'unknown'
  const height = job?.targetHeight ?? 'unknown'
  const filename = `sprite-forge-${jobId}-variant-${variant.variantIndex}-${width}x${height}.png`

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return buffer
})

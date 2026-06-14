import { storage } from '../../../services/storage'
import { createVariantZip } from '../../../services/zip-export'
import { getJobById } from '../../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const job = await getJobById(id!)

  const completedVariants = job.variants.filter(v => v.status === 'completed' && v.finalImagePath)

  if (completedVariants.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'No completed variants available for download.' })
  }

  const variantBuffers = await Promise.all(
    completedVariants.map(async (variant) => {
      const buffer = await storage.readFile(variant.finalImagePath!)
      return { index: variant.variantIndex, buffer }
    }),
  )

  const metadata = {
    jobId: job.id,
    uploadId: job.uploadId,
    model: job.model,
    userPrompt: job.userPrompt,
    stylePresetId: job.stylePresetId,
    stylePrompt: job.stylePrompt,
    targetWidth: job.targetWidth,
    targetHeight: job.targetHeight,
    variantCount: job.variantCount,
    createdAt: job.createdAt,
    variants: job.variants.map(v => ({
      index: v.variantIndex,
      status: v.status,
      direction: v.variantDirection,
      errorMessage: v.errorMessage,
    })),
  }

  const metadataJson = JSON.stringify(metadata, null, 2)

  const { buffer } = await createVariantZip({
    jobId: job.id,
    variantBuffers,
    metadataJson,
  })

  const filename = `sprite-forge-${job.id}.zip`

  setResponseHeader(event, 'Content-Type', 'application/zip')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return buffer
})

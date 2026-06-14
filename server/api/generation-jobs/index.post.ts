import { eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { generationJobs, generatedVariants, uploads } from '../../db/schema'
import { getOpenRouterConfig, generateImage } from '../../services/openrouter'
import { processGeneratedImage, isPixelArtPreset } from '../../services/image-processing'
import { storage } from '../../services/storage'
import {
  buildGenerationPrompt,
  createGenerationJobSchema,
  getStylePresetById,
  getVariantDirections,
} from '../../services/style-presets'
import { bufferToPngDataUrl } from '../../utils/data-url'

async function resolveUpload(input: { uploadId: string }) {
  const upload = await db.query.uploads.findFirst({
    where: eq(uploads.id, input.uploadId),
  })

  if (!upload) {
    throw createError({ statusCode: 404, statusMessage: 'Upload not found.' })
  }

  return upload
}

async function generateSingleVariant(params: {
  jobId: string
  variantId: string
  variantIndex: number
  variantDirection: string
  model: string
  stylePresetId: string
  stylePrompt: string
  userPrompt: string
  targetWidth: number
  targetHeight: number
  backgroundMode: 'transparent' | 'plain'
  base64ImageDataUrl: string
  config: ReturnType<typeof getOpenRouterConfig>
}): Promise<{ status: 'completed' | 'failed'; errorMessage?: string }> {
  const {
    jobId, variantId, variantIndex, variantDirection, model,
    stylePresetId, stylePrompt, userPrompt, targetWidth, targetHeight,
    backgroundMode, base64ImageDataUrl, config,
  } = params

  const prompt = buildGenerationPrompt({
    stylePreset: { id: stylePresetId, name: stylePresetId, prompt: stylePrompt },
    userPrompt,
    targetWidth,
    targetHeight,
    variantDirection,
    backgroundMode,
  })

  await db.insert(generatedVariants).values({
    id: variantId,
    jobId,
    status: 'running',
    variantIndex,
    variantDirection,
    model,
  })

  try {
    const { imageDataUrl, responseJson } = await generateImage({
      model,
      apiKey: config.apiKey,
      siteUrl: config.siteUrl,
      appName: config.appName,
      prompt,
      base64ImageDataUrl,
    })

    const processed = await processGeneratedImage({
      dataUrl: imageDataUrl,
      targetWidth,
      targetHeight,
      useNearestNeighbor: isPixelArtPreset(stylePresetId),
      removeBackground: backgroundMode === 'transparent',
    })

    const rawPath = storage.jobPath(jobId, 'variants', `${variantId}.raw.png`)
    const finalPath = storage.jobPath(jobId, 'variants', `${variantId}.png`)
    const previewPath = storage.jobPath(jobId, 'variants', `${variantId}.preview.png`)

    await Promise.all([
      storage.writeFile(rawPath, processed.rawBuffer),
      storage.writeFile(finalPath, processed.finalBuffer),
      storage.writeFile(previewPath, processed.previewBuffer),
    ])

    await db.update(generatedVariants)
      .set({
        status: 'completed',
        rawImagePath: rawPath,
        finalImagePath: finalPath,
        previewImagePath: previewPath,
        openrouterResponseJson: responseJson,
      })
      .where(eq(generatedVariants.id, variantId))

    return { status: 'completed' }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generation error.'
    console.error(`Variant ${variantIndex} failed for job ${jobId}:`, error)

    await db.update(generatedVariants)
      .set({
        status: 'failed',
        errorMessage: message,
      })
      .where(eq(generatedVariants.id, variantId))

    return { status: 'failed', errorMessage: message }
  }
}

function updateJobStatus(jobId: string, variantResults: Array<{ status: string }>, jobErrorMessage: string | null) {
  const completedCount = variantResults.filter(v => v.status === 'completed').length
  const totalCount = variantResults.length

  if (completedCount === totalCount) {
    return db.update(generationJobs)
      .set({ status: 'completed' })
      .where(eq(generationJobs.id, jobId))
  }

  if (completedCount === 0) {
    return db.update(generationJobs)
      .set({ status: 'failed', errorMessage: jobErrorMessage })
      .where(eq(generationJobs.id, jobId))
  }

  return db.update(generationJobs)
    .set({ status: 'completed', errorMessage: jobErrorMessage })
    .where(eq(generationJobs.id, jobId))
}

// fallow-ignore-next-line complexity
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parseResult = createGenerationJobSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid generation input: ${parseResult.error.issues.map(i => i.message).join('; ')}`,
    })
  }

  const input = parseResult.data

  const stylePreset = getStylePresetById(input.stylePresetId)
  if (!stylePreset) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown style preset: ${input.stylePresetId}.`,
    })
  }

  const upload = await resolveUpload(input)
  const uploadBuffer = await storage.readFile(upload.storagePath)
  const base64ImageDataUrl = bufferToPngDataUrl(uploadBuffer)

  const jobId = crypto.randomUUID()
  const config = getOpenRouterConfig()
  const model: string = input.model || config.model

  await db.insert(generationJobs).values({
    id: jobId,
    uploadId: input.uploadId,
    status: 'running',
    model,
    userPrompt: input.userPrompt,
    stylePresetId: input.stylePresetId,
    stylePrompt: stylePreset.prompt,
    targetWidth: input.targetWidth,
    targetHeight: input.targetHeight,
    variantCount: input.variantCount,
    backgroundMode: input.backgroundMode,
  }).returning()

  const variantDirections = getVariantDirections(input.variantCount)
  const variantResults: Array<{ status: string }> = []
  let jobErrorMessage: string | null = null

  for (let i = 0; i < input.variantCount; i++) {
    const variantIndex = i + 1
    const variantId = crypto.randomUUID()
    const result = await generateSingleVariant({
      jobId,
      variantId,
      variantIndex,
      variantDirection: variantDirections[i]!,
      model,
      stylePresetId: input.stylePresetId,
      stylePrompt: stylePreset.prompt,
      userPrompt: input.userPrompt,
      targetWidth: input.targetWidth,
      targetHeight: input.targetHeight,
      backgroundMode: input.backgroundMode,
      base64ImageDataUrl,
      config,
    })

    variantResults.push(result)
    if (result.status === 'failed' && !jobErrorMessage) {
      jobErrorMessage = result.errorMessage ?? null
    }
  }

  await updateJobStatus(jobId, variantResults, jobErrorMessage)

  const updatedJob = await db.query.generationJobs.findFirst({
    where: eq(generationJobs.id, jobId),
    with: { variants: true, upload: true },
  })

  return { job: updatedJob }
})

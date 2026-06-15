import { eq } from 'drizzle-orm'

import { db } from '../db/client'
import { generationJobs, generatedVariants, spriteEdits, uploads } from '../db/schema'

export async function getJobById(id: string) {
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

  return job
}

export async function getUploadById(id: string) {
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Upload ID is required.' })
  }

  const upload = await db.query.uploads.findFirst({
    where: eq(uploads.id, id),
  })

  if (!upload) {
    throw createError({ statusCode: 404, statusMessage: 'Upload not found.' })
  }

  return upload
}

export async function getVariantById(id: string) {
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Variant ID is required.' })
  }

  const variant = await db.query.generatedVariants.findFirst({
    where: eq(generatedVariants.id, id),
  })

  if (!variant) {
    throw createError({ statusCode: 404, statusMessage: 'Variant not found.' })
  }

  return variant
}

export async function getSpriteEditById(id: string) {
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Sprite edit ID is required.' })
  }

  const edit = await db.query.spriteEdits.findFirst({
    where: eq(spriteEdits.id, id),
  })

  if (!edit) {
    throw createError({ statusCode: 404, statusMessage: 'Sprite edit not found.' })
  }

  return edit
}

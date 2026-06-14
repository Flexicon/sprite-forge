import { readFileOrNotFound } from '../../../utils/storage-helpers'
import { getVariantById } from '../../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const variant = await getVariantById(id!)

  if (!variant.finalImagePath) {
    throw createError({ statusCode: 404, statusMessage: 'Variant image not found.' })
  }

  const buffer = await readFileOrNotFound(variant.finalImagePath)

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  return buffer
})

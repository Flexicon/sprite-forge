import { storage } from '../../../services/storage'
import { getVariantById } from '../../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const variant = await getVariantById(id!)

  if (!variant.previewImagePath) {
    throw createError({ statusCode: 404, statusMessage: 'Variant preview not found.' })
  }

  const buffer = await storage.readFile(variant.previewImagePath)

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  return buffer
})

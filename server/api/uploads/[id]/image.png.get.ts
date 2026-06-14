import { storage } from '../../../services/storage'
import { getUploadById } from '../../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const upload = await getUploadById(id!)
  const buffer = await storage.readFile(upload.storagePath)

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  return buffer
})

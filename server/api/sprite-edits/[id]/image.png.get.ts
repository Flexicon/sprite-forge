import { readFileOrNotFound } from '../../../utils/storage-helpers'
import { getSpriteEditById } from '../../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const edit = await getSpriteEditById(id!)
  const buffer = await readFileOrNotFound(edit.storagePath)

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  return buffer
})

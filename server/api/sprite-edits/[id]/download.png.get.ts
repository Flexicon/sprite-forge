import { readFileOrNotFound } from '../../../utils/storage-helpers'
import { getSpriteEditById } from '../../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const edit = await getSpriteEditById(id!)
  const buffer = await readFileOrNotFound(edit.storagePath)
  const filename = `sprite-forge-edit-${edit.id}-${edit.width}x${edit.height}.png`

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return buffer
})

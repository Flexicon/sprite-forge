import { eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { spriteEdits } from '../../db/schema'
import { storage } from '../../services/storage'
import { getSpriteEditById } from '../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const edit = await getSpriteEditById(id!)

  await db.delete(spriteEdits).where(eq(spriteEdits.id, edit.id))
  await storage.remove(edit.storagePath)

  return { deleted: true }
})

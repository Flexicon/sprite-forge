import { eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { uploads } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Upload ID is required.' })
  }

  const upload = await db.query.uploads.findFirst({
    where: eq(uploads.id, id),
  })

  if (!upload) {
    throw createError({ statusCode: 404, statusMessage: 'Upload not found.' })
  }

  return { upload }
})

import { getSpriteEditById } from '../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const edit = await getSpriteEditById(id!)

  return { edit }
})

import { getJobById } from '../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const job = await getJobById(id!)

  return { job }
})

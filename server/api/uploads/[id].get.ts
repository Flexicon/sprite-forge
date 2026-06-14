import { getUploadById } from '../../utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const upload = await getUploadById(id!)
  return { upload }
})

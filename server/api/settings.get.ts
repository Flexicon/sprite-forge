import { checkDatabaseHealth } from '../db/health'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const database = await checkDatabaseHealth()

  return {
    model: config.openrouterDefaultModel,
    storageDir: config.storageDir,
    database,
  }
})

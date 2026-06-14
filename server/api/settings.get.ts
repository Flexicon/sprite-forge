import { checkDatabaseHealth } from '../db/health'
import { storage } from '../services/storage'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const database = await checkDatabaseHealth()
  const storageHealth = await storage.checkHealth()

  return {
    model: config.openrouterDefaultModel,
    storageDir: config.storageDir,
    database,
    storage: storageHealth,
  }
})

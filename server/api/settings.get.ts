import { checkDatabaseHealth } from '../db/health'
import { storage } from '../services/storage'
import { STYLE_PRESETS, SUPPORTED_SIZES } from '../services/style-presets'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const database = await checkDatabaseHealth()
  const storageHealth = await storage.checkHealth()

  return {
    model: config.openrouterDefaultModel,
    apiKeyConfigured: Boolean(config.openrouterApiKey),
    storageDir: config.storageDir,
    database,
    storage: storageHealth,
    stylePresets: STYLE_PRESETS,
    supportedSizes: SUPPORTED_SIZES,
  }
})

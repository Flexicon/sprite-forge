import { storage } from '../services/storage'

function isEnoentError(error: unknown): error is { code: 'ENOENT' } {
  return !!error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
}

export async function readFileOrNotFound(path: string): Promise<Buffer> {
  try {
    return await storage.readFile(path)
  }
  catch (error) {
    if (isEnoentError(error)) {
      throw createError({ statusCode: 404, statusMessage: 'Variant image not found.' })
    }
    throw error
  }
}

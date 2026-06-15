import { db } from '../../db/client'
import { spriteEdits } from '../../db/schema'
import { normalizeSpriteEdit } from '../../services/image-processing'
import { storage } from '../../services/storage'
import { getSpriteEditById, getUploadById, getVariantById } from '../../utils/api-helpers'

const SOURCE_TYPES = new Set(['variant', 'upload', 'edit'])
type MultipartPart = NonNullable<Awaited<ReturnType<typeof readMultipartFormData>>>[number]
type UploadedEditFile = MultipartPart & { filename: string; type: string }
type SpriteEditSourceType = 'variant' | 'upload' | 'edit'
type SourceValidator = (sourceId: string) => Promise<void>

const sourceValidators: Record<SpriteEditSourceType, SourceValidator> = {
  variant: async (sourceId) => {
    const variant = await getVariantById(sourceId)
    if (!variant.finalImagePath) {
      throw spriteEditError(400, 'Only completed generated variants can be edited.')
    }
  },
  upload: async (sourceId) => {
    await getUploadById(sourceId)
  },
  edit: async (sourceId) => {
    await getSpriteEditById(sourceId)
  },
}

function spriteEditError(statusCode: number, statusMessage: string) {
  return createError({ statusCode, statusMessage })
}

function getFieldValue(form: MultipartPart[] | undefined, name: string) {
  return form?.find(part => part.name === name && !part.filename)?.data.toString('utf8').trim() || ''
}

function getUploadedEditFile(form: MultipartPart[] | undefined): UploadedEditFile | undefined {
  return form?.find(part => part.name === 'file' && part.filename) as UploadedEditFile | undefined
}

function parseSourceType(value: string): SpriteEditSourceType {
  if (!SOURCE_TYPES.has(value)) {
    throw spriteEditError(400, 'Source type must be variant, upload, or edit.')
  }

  return value as SpriteEditSourceType
}

function assertValidFile(file: UploadedEditFile | undefined): asserts file is UploadedEditFile {
  if (!file) {
    throw spriteEditError(400, 'Saving an edit requires a PNG file field named "file".')
  }

  if (file.type !== 'image/png') {
    throw spriteEditError(415, 'Edited sprite must be uploaded as a PNG image.')
  }
}

async function assertValidSource(sourceType: SpriteEditSourceType, sourceId: string) {
  if (!sourceId) {
    throw spriteEditError(400, 'Source ID is required.')
  }

  await sourceValidators[sourceType](sourceId)
}

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const sourceType = parseSourceType(getFieldValue(form, 'sourceType'))
  const sourceId = getFieldValue(form, 'sourceId')
  const file = getUploadedEditFile(form)

  assertValidFile(file)
  await assertValidSource(sourceType, sourceId)

  const normalized = await normalizeSpriteEdit({ data: file.data }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Invalid edited sprite image.'
    throw spriteEditError(400, message)
  })

  const editId = crypto.randomUUID()
  const storagePath = storage.editPath(editId)

  await storage.writeFile(storagePath, normalized.buffer).catch((error: unknown) => {
    console.error('Failed to write edited sprite.', error)
    throw spriteEditError(500, 'Unable to save edited sprite image.')
  })

  const [edit] = await db.insert(spriteEdits).values({
    id: editId,
    sourceType,
    sourceId,
    width: normalized.width,
    height: normalized.height,
    storagePath,
  }).returning()

  return { edit }
})

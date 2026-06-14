import sharp from 'sharp'

import { db } from '../db/client'
import { uploads } from '../db/schema'
import { storage } from '../services/storage'

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
type MultipartFile = NonNullable<Awaited<ReturnType<typeof readMultipartFormData>>>[number]
type UploadedFile = MultipartFile & { filename: string; type: string }

function uploadError(statusCode: number, statusMessage: string) {
  return createError({ statusCode, statusMessage })
}

function getUploadedFile(form: Awaited<ReturnType<typeof readMultipartFormData>>): UploadedFile | undefined {
  return form?.find(part => part.name === 'file' && part.filename) as UploadedFile | undefined
}

function assertValidFile(file: ReturnType<typeof getUploadedFile>): asserts file is UploadedFile {
  if (!file) {
    throw uploadError(400, 'Upload requires a file field named "file".')
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw uploadError(415, 'Unsupported image type. Upload a PNG, JPEG, or WebP image.')
  }

  if (file.data.byteLength > MAX_UPLOAD_BYTES) {
    throw uploadError(413, 'Upload is too large. Maximum file size is 10 MB.')
  }
}

async function getImageMetadata(data: Buffer) {
  const metadata = await sharp(data).metadata().catch((error: unknown) => {
    console.error('Failed to read upload image metadata.', error)
    throw uploadError(400, 'Unable to read image metadata. The file may be corrupt or unsupported.')
  })

  if (!metadata.width || !metadata.height) {
    throw uploadError(400, 'Unable to determine image dimensions.')
  }

  return metadata
}

async function normalizeToPng(data: Buffer) {
  return sharp(data)
    .rotate()
    .png()
    .toBuffer()
    .catch((error: unknown) => {
      console.error('Failed to normalize upload image.', error)
      throw uploadError(500, 'Unable to process uploaded image.')
    })
}

async function writeUpload(storagePath: string, png: Buffer) {
  await storage.writeFile(storagePath, png).catch((error: unknown) => {
    console.error('Failed to write upload image.', error)
    throw uploadError(500, 'Unable to save uploaded image.')
  })
}

function getImageSizeWarning(width: number, height: number) {
  if (Math.max(width, height) > 2048) {
    return 'Source image is larger than 2048x2048. Generation may be slower or less predictable.'
  }

  return null
}

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = getUploadedFile(form)
  assertValidFile(file)

  const metadata = await getImageMetadata(file.data)

  const uploadId = crypto.randomUUID()
  const storagePath = storage.uploadPath(uploadId)
  const png = await normalizeToPng(file.data)
  await writeUpload(storagePath, png)

  const [upload] = await db.insert(uploads).values({
    id: uploadId,
    originalFilename: file.filename,
    mimeType: file.type,
    sizeBytes: file.data.byteLength,
    width: metadata.width,
    height: metadata.height,
    storagePath,
  }).returning()

  return {
    upload,
    warning: getImageSizeWarning(metadata.width, metadata.height),
  }
})

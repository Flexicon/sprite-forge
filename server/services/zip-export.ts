import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { ZipArchive } from 'archiver'

import { storage } from './storage'

export async function createVariantZip(params: {
  jobId: string
  variantBuffers: Array<{ index: number; buffer: Buffer }>
  metadataJson: string
}): Promise<{ path: string; buffer: Buffer }> {
  const { jobId, variantBuffers, metadataJson } = params
  const zipPath = storage.jobPath(jobId, 'exports', 'all-variants.zip')
  const absolutePath = storage.resolvePath(zipPath)

  await mkdir(dirname(absolutePath), { recursive: true })

  const archive = new ZipArchive({ zlib: { level: 6 } })
  const chunks: Buffer[] = []

  archive.on('data', (chunk: Buffer) => chunks.push(chunk))

  const completionPromise = new Promise<void>((resolve, reject) => {
    archive.on('end', resolve)
    archive.on('error', reject)
    archive.on('warning', reject)
  })

  for (const { index, buffer } of variantBuffers) {
    archive.append(buffer, { name: `variant-${index}.png` })
  }

  archive.append(metadataJson, { name: 'metadata.json' })
  archive.finalize()

  await completionPromise

  const buffer = Buffer.concat(chunks)
  await storage.writeFile(zipPath, buffer)

  return { path: zipPath, buffer }
}

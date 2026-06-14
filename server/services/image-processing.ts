import sharp from 'sharp'

import { parseDataUrl } from '../utils/data-url'

export type ProcessedImage = {
  rawBuffer: Buffer
  finalBuffer: Buffer
  previewBuffer: Buffer
  finalWidth: number
  finalHeight: number
  previewWidth: number
  previewHeight: number
}

export type ProcessImageOptions = {
  dataUrl: string
  targetWidth: number
  targetHeight: number
  useNearestNeighbor: boolean
  previewSize?: number
}

export async function processGeneratedImage(options: ProcessImageOptions): Promise<ProcessedImage> {
  const { dataUrl, targetWidth, targetHeight, useNearestNeighbor, previewSize = 512 } = options

  const { data: rawBufferDecoded } = parseDataUrl(dataUrl)

  const inputSharp = sharp(rawBufferDecoded)
  const metadata = await inputSharp.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to determine generated image dimensions.')
  }

  const rawBuffer = await sharp(rawBufferDecoded).png().toBuffer()

  const resizeKernel = useNearestNeighbor ? 'nearest' : 'lanczos3'

  const finalBuffer = await sharp(rawBuffer)
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: resizeKernel,
    })
    .png()
    .toBuffer()

  const previewBuffer = await sharp(finalBuffer)
    .resize({
      width: previewSize,
      height: previewSize,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'nearest',
    })
    .png()
    .toBuffer()

  return {
    rawBuffer,
    finalBuffer,
    previewBuffer,
    finalWidth: targetWidth,
    finalHeight: targetHeight,
    previewWidth: previewSize,
    previewHeight: previewSize,
  }
}

export function isPixelArtPreset(presetId: string): boolean {
  const pixelArtIds = ['pixel-art', 'snes-rpg', 'gba-rpg', 'monochrome-1bit']
  return pixelArtIds.includes(presetId)
}

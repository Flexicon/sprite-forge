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
  removeBackground: boolean
  previewSize?: number
}

function isRemovableBackgroundPixel(data: Buffer, offset: number): boolean {
  const red = data[offset]!
  const green = data[offset + 1]!
  const blue = data[offset + 2]!
  const alpha = data[offset + 3]!

  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)

  return alpha <= 10 || (min >= 185 && max - min <= 35)
}

// fallow-ignore-next-line complexity
async function removeEdgeConnectedBackground(inputBuffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const visited = new Uint8Array(width * height)
  const stack = new Int32Array(width * height)
  let stackSize = 0

  function pushIfBackground(x: number, y: number) {
    const pixelIndex = y * width + x
    if (visited[pixelIndex]) return

    const offset = pixelIndex * channels
    if (!isRemovableBackgroundPixel(data, offset)) return

    visited[pixelIndex] = 1
    stack[stackSize] = pixelIndex
    stackSize += 1
  }

  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0)
    pushIfBackground(x, height - 1)
  }

  for (let y = 1; y < height - 1; y += 1) {
    pushIfBackground(0, y)
    pushIfBackground(width - 1, y)
  }

  while (stackSize > 0) {
    stackSize -= 1
    const pixelIndex = stack[stackSize]!
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    const offset = pixelIndex * channels

    data[offset] = 0
    data[offset + 1] = 0
    data[offset + 2] = 0
    data[offset + 3] = 0

    if (x > 0) pushIfBackground(x - 1, y)
    if (x < width - 1) pushIfBackground(x + 1, y)
    if (y > 0) pushIfBackground(x, y - 1)
    if (y < height - 1) pushIfBackground(x, y + 1)
  }

  return sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer()
}

export async function processGeneratedImage(options: ProcessImageOptions): Promise<ProcessedImage> {
  const { dataUrl, targetWidth, targetHeight, useNearestNeighbor, removeBackground, previewSize = 512 } = options

  const { data: rawBufferDecoded } = parseDataUrl(dataUrl)

  const rawBuffer = await sharp(rawBufferDecoded).png().toBuffer()
  const processingBuffer = removeBackground ? await removeEdgeConnectedBackground(rawBuffer) : rawBuffer

  const resizeKernel = useNearestNeighbor ? 'nearest' : 'lanczos3'

  const finalBuffer = await sharp(processingBuffer)
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

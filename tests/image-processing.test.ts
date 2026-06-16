import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { normalizeSpriteEdit, processGeneratedImage, isPixelArtPreset } from '../server/services/image-processing'
import { bufferToPngDataUrl } from '../server/utils/data-url'

async function createCoinLikeFixtureDataUrl() {
  const width = 5
  const height = 5
  const channels = 4
  const data = Buffer.alloc(width * height * channels)

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * channels
    data[offset] = 255
    data[offset + 1] = 255
    data[offset + 2] = 255
    data[offset + 3] = 255
  }

  for (let y = 1; y <= 3; y += 1) {
    for (let x = 1; x <= 3; x += 1) {
      const offset = (y * width + x) * channels
      data[offset] = 220
      data[offset + 1] = 160
      data[offset + 2] = 20
      data[offset + 3] = 255
    }
  }

  const centerOffset = (2 * width + 2) * channels
  data[centerOffset] = 255
  data[centerOffset + 1] = 255
  data[centerOffset + 2] = 255
  data[centerOffset + 3] = 255

  const png = await sharp(data, { raw: { width, height, channels } }).png().toBuffer()
  return bufferToPngDataUrl(png)
}

async function readRawPng(buffer: Buffer) {
  return sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
}

function pixel(data: Buffer, width: number, x: number, y: number) {
  const offset = (y * width + x) * 4
  return Array.from(data.subarray(offset, offset + 4))
}

describe('image processing', () => {
  it('identifies pixel-art presets', () => {
    expect(isPixelArtPreset('pixel-art')).toBe(true)
    expect(isPixelArtPreset('snes-rpg')).toBe(true)
    expect(isPixelArtPreset('gba-rpg')).toBe(true)
    expect(isPixelArtPreset('monochrome-1bit')).toBe(true)
    expect(isPixelArtPreset('dark-fantasy')).toBe(false)
  })

  it('removes edge-connected white background while preserving interior white detail', async () => {
    const result = await processGeneratedImage({
      dataUrl: await createCoinLikeFixtureDataUrl(),
      targetWidth: 5,
      targetHeight: 5,
      useNearestNeighbor: true,
      removeBackground: true,
      previewSize: 10,
    })

    const final = await readRawPng(result.finalBuffer)

    expect(final.info.width).toBe(5)
    expect(final.info.height).toBe(5)
    expect(pixel(final.data, 5, 0, 0)).toEqual([0, 0, 0, 0])
    expect(pixel(final.data, 5, 1, 1)).toEqual([220, 160, 20, 255])
    expect(pixel(final.data, 5, 2, 2)).toEqual([255, 255, 255, 255])

    const preview = await readRawPng(result.previewBuffer)
    expect(preview.info.width).toBe(10)
    expect(preview.info.height).toBe(10)
    expect(pixel(preview.data, 10, 0, 0)).toEqual([0, 0, 0, 0])
  })

  it('preserves a white edge background when background removal is disabled', async () => {
    const result = await processGeneratedImage({
      dataUrl: await createCoinLikeFixtureDataUrl(),
      targetWidth: 5,
      targetHeight: 5,
      useNearestNeighbor: true,
      removeBackground: false,
      previewSize: 10,
    })

    const final = await readRawPng(result.finalBuffer)

    expect(pixel(final.data, 5, 0, 0)).toEqual([255, 255, 255, 255])
  })

  it('normalizes edited PNG uploads with an alpha channel and dimensions', async () => {
    const source = await sharp({
      create: {
        width: 3,
        height: 2,
        channels: 3,
        background: { r: 30, g: 120, b: 210 },
      },
    }).png().toBuffer()

    const edit = await normalizeSpriteEdit({ data: source })
    const raw = await readRawPng(edit.buffer)

    expect(edit.width).toBe(3)
    expect(edit.height).toBe(2)
    expect(raw.info.channels).toBe(4)
    expect(pixel(raw.data, 3, 0, 0)).toEqual([30, 120, 210, 255])
  })

  it('rejects non-PNG edited sprite uploads', async () => {
    const jpeg = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    }).jpeg().toBuffer()

    await expect(normalizeSpriteEdit({ data: jpeg })).rejects.toThrow('Edited sprite must be a PNG image.')
  })

  it('rejects edited sprite uploads that exceed byte or dimension limits', async () => {
    const png = await sharp({
      create: {
        width: 3,
        height: 3,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).png().toBuffer()

    await expect(normalizeSpriteEdit({ data: png, maxBytes: 1 })).rejects.toThrow('Edited PNG is too large.')
    await expect(normalizeSpriteEdit({ data: png, maxDimension: 2 })).rejects.toThrow('Edited sprite dimensions must be 2x2 or smaller.')
  })
})

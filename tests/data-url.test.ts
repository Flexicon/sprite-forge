import { describe, expect, it } from 'vitest'

import { bufferToPngDataUrl, parseDataUrl } from '../server/utils/data-url'

describe('data URL utilities', () => {
  it('round-trips a PNG buffer through a data URL', () => {
    const source = Buffer.from('sprite-forge')
    const dataUrl = bufferToPngDataUrl(source)

    expect(dataUrl).toBe('data:image/png;base64,c3ByaXRlLWZvcmdl')
    expect(parseDataUrl(dataUrl)).toEqual({
      mimeType: 'image/png',
      data: source,
    })
  })

  it('parses other base64 image MIME types', () => {
    const parsed = parseDataUrl('data:image/webp;base64,d2VicA==')

    expect(parsed.mimeType).toBe('image/webp')
    expect(parsed.data.toString()).toBe('webp')
  })

  it('rejects malformed data URLs', () => {
    expect(() => parseDataUrl('image/png;base64,abc')).toThrow('Invalid data URL format.')
    expect(() => parseDataUrl('data:image/png,abc')).toThrow('Invalid data URL format.')
  })
})

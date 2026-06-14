export function parseDataUrl(dataUrl: string): { mimeType: string; data: Buffer } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)

  if (!match) {
    throw new Error(`Invalid data URL format.`)
  }

  const mimeType = match[1]
  const base64 = match[2]

  if (!mimeType || !base64) {
    throw new Error('Invalid data URL: missing mime type or base64 payload.')
  }

  return {
    mimeType,
    data: Buffer.from(base64, 'base64'),
  }
}

export function bufferToPngDataUrl(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString('base64')}`
}

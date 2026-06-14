import { afterEach, describe, expect, it, vi } from 'vitest'

import { generateImage } from '../server/services/openrouter'

const requestParams = {
  model: 'test/image-model',
  apiKey: 'test-key',
  siteUrl: 'http://localhost:4179',
  appName: 'Sprite Forge Test',
  prompt: 'Make a sprite.',
  base64ImageDataUrl: 'data:image/png;base64,c291cmNl',
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('OpenRouter image generation adapter', () => {
  it('sends a chat-completions request with text, source image, and image modality', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      id: 'response-1',
      model: 'test/image-model',
      created: 1,
      choices: [{
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: null,
          images: ['data:image/png;base64,Z2VuZXJhdGVk'],
        },
      }],
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateImage(requestParams)
    const [, request] = fetchMock.mock.calls[0]!
    const body = JSON.parse((request as RequestInit).body as string)

    expect(result.imageDataUrl).toBe('data:image/png;base64,Z2VuZXJhdGVk')
    expect(body.model).toBe('test/image-model')
    expect(body.modalities).toEqual(['image', 'text'])
    expect(body.messages[0].content).toEqual([
      { type: 'text', text: 'Make a sprite.' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,c291cmNl' } },
    ])
    expect((request as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'HTTP-Referer': 'http://localhost:4179',
      'X-Title': 'Sprite Forge Test',
    })
  })

  it('extracts a markdown-embedded image data URL from text content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      id: 'response-2',
      model: 'test/image-model',
      created: 1,
      choices: [{
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: 'Here it is: ![sprite](data:image/png;base64,Z2VuZXJhdGVk)',
        },
      }],
    })))

    await expect(generateImage(requestParams)).resolves.toMatchObject({
      imageDataUrl: 'data:image/png;base64,Z2VuZXJhdGVk',
    })
  })

  it('normalizes octet-stream image payloads to PNG data URLs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      id: 'response-3',
      model: 'test/image-model',
      created: 1,
      choices: [{
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: 'data:application/octet-stream;base64,Z2VuZXJhdGVk',
        },
      }],
    })))

    await expect(generateImage(requestParams)).resolves.toMatchObject({
      imageDataUrl: 'data:image/png;base64,Z2VuZXJhdGVk',
    })
  })

  it('throws a clear error when OpenRouter returns no image', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      id: 'response-4',
      model: 'test/image-model',
      created: 1,
      choices: [{
        finish_reason: 'stop',
        message: { role: 'assistant', content: 'No image here.' },
      }],
    })))

    await expect(generateImage(requestParams)).rejects.toThrow('Could not extract image data URL')
  })

  it('surfaces OpenRouter API errors with response details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 })))

    await expect(generateImage(requestParams)).rejects.toThrow('OpenRouter API error 429: rate limited')
  })
})

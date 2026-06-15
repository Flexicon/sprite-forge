import { z } from 'zod'

const imageUrlItemSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string(),
  }),
})

const openrouterImageResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string().nullable(),
      role: z.string(),
      images: z.array(z.union([z.string(), imageUrlItemSchema])).optional(),
    }).passthrough(),
    finish_reason: z.string().nullable(),
  })).min(1),
  id: z.string(),
  model: z.string(),
  created: z.number(),
}).passthrough()

class OpenRouterError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

export type OpenRouterConfig = {
  apiKey: string
  model: string
  siteUrl: string
  appName: string
}

export function getOpenRouterConfig(): OpenRouterConfig {
  const config = useRuntimeConfig()

  const apiKey = config.openrouterApiKey
  if (!apiKey) {
    throw new OpenRouterError('Missing OPENROUTER_API_KEY. Add it to your .env file and restart the dev server.', 500)
  }

  return {
    apiKey,
    model: config.openrouterDefaultModel as string,
    siteUrl: (config.openrouterSiteUrl as string) || 'http://localhost:3674',
    appName: (config.openrouterAppName as string) || 'Sprite Forge',
  }
}

type Extractor = {
  pattern: RegExp
  transform: (match: RegExpMatchArray) => string | null
}

const EXTRACTORS: Extractor[] = [
  {
    pattern: /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/,
    transform: (m) => {
      const base64 = m[2]
      return base64 ? `data:image/${m[1]};base64,${base64}` : null
    },
  },
  {
    pattern: /^data:application\/octet-stream;base64,([A-Za-z0-9+/=]+)$/,
    transform: (m) => {
      const base64 = m[1]
      return base64 ? `data:image/png;base64,${base64}` : null
    },
  },
  {
    pattern: /!\[.*?\]\((data:image\/[^;]+;base64,[^)]+)\)/,
    transform: (m) => m[1] ?? null,
  },
  {
    pattern: /^[A-Za-z0-9+/=]{100,}$/,
    transform: (m) => `data:image/png;base64,${m[0]}`,
  },
]

function extractImageDataUrl(content: string): string | null {
  for (const extractor of EXTRACTORS) {
    const match = content.match(extractor.pattern)
    if (match) {
      const result = extractor.transform(match)
      if (result) {
        return result
      }
    }
  }
  return null
}

type ImageItem = string | { type: 'image_url'; image_url: { url: string } }

function imageItemToDataUrl(image: ImageItem): string {
  return typeof image === 'string' ? image : image.image_url.url
}

function assertHasImageContent(content: string | null | undefined, images: ImageItem[] | undefined): void {
  if (content) return
  if (images && images.length > 0) return
  throw new OpenRouterError('OpenRouter returned no image content in the response.')
}

function validateResponse(body: unknown): { content: string | null; images: ImageItem[] | undefined; responseJson: string } {
  const parsed = openrouterImageResponseSchema.safeParse(body)
  if (!parsed.success) {
    throw new OpenRouterError(`Unexpected OpenRouter response structure: ${JSON.stringify(body).slice(0, 500)}`)
  }

  const choices = parsed.data.choices
  if (choices.length === 0) {
    throw new OpenRouterError('OpenRouter returned no image content in the response.')
  }

  const message = choices[0]!.message
  assertHasImageContent(message.content, message.images)

  return { content: message.content ?? null, images: message.images, responseJson: JSON.stringify(body) }
}

function resolveImageDataUrl(content: string | null, images: ImageItem[] | undefined): string | null {
  if (images && images.length > 0) {
    return imageItemToDataUrl(images[0]!)
  }
  if (content) {
    return extractImageDataUrl(content)
  }
  return null
}

async function throwApiError(response: Response): Promise<never> {
  const text = await response.text().catch(() => null)
  throw new OpenRouterError(
    `OpenRouter API error ${response.status}: ${text || response.statusText}`,
    response.status,
  )
}

export async function generateImage(params: {
  model: string
  apiKey: string
  siteUrl: string
  appName: string
  prompt: string
  base64ImageDataUrl: string
}): Promise<{ imageDataUrl: string; responseJson: string }> {
  const { model, apiKey, siteUrl, appName, prompt, base64ImageDataUrl } = params

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': appName,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64ImageDataUrl } },
          ],
        },
      ],
      modalities: ['image', 'text'],
    }),
  })

  if (!response.ok) {
    return throwApiError(response)
  }

  const rawBody = await response.json()
  const { content, images, responseJson } = validateResponse(rawBody)
  const imageDataUrl = resolveImageDataUrl(content, images)

  if (!imageDataUrl) {
    const preview = content ? content.slice(0, 200) : 'null'
    throw new OpenRouterError(`Could not extract image data URL from response content. Content preview: ${preview}`)
  }

  return { imageDataUrl, responseJson }
}

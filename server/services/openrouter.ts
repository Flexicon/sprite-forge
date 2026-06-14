import { z } from 'zod'

const openrouterImageResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string().nullable(),
      role: z.string(),
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
    siteUrl: (config.openrouterSiteUrl as string) || 'http://localhost:4179',
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

function validateResponse(body: unknown): { content: string; responseJson: string } {
  const parsed = openrouterImageResponseSchema.safeParse(body)
  if (!parsed.success) {
    throw new OpenRouterError(`Unexpected OpenRouter response structure: ${JSON.stringify(body).slice(0, 500)}`)
  }

  const choice = parsed.data.choices[0]
  const content = choice?.message?.content

  if (!content) {
    throw new OpenRouterError('OpenRouter returned no image content in the response.')
  }

  return { content, responseJson: JSON.stringify(body) }
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
    const text = await response.text().catch(() => null)
    throw new OpenRouterError(
      `OpenRouter API error ${response.status}: ${text || response.statusText}`,
      response.status,
    )
  }

  const rawBody = await response.json()
  const { content, responseJson } = validateResponse(rawBody)
  const imageDataUrl = extractImageDataUrl(content)

  if (!imageDataUrl) {
    throw new OpenRouterError(`Could not extract image data URL from response content. Content preview: ${content.slice(0, 200)}`)
  }

  return { imageDataUrl, responseJson }
}



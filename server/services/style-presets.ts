import { z } from 'zod'

export const SUPPORTED_SIZES = [16, 24, 32, 48, 64, 96, 128] as const

export const STYLE_PRESETS = [
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    prompt: 'crisp pixel art game sprite, limited palette, clean silhouette, readable small-scale forms, nearest-neighbor aesthetic',
  },
  {
    id: 'snes-rpg',
    name: 'SNES RPG',
    prompt: '16-bit SNES RPG-style sprite, colorful fantasy game asset, clean clusters, readable outline, limited detail',
  },
  {
    id: 'gba-rpg',
    name: 'GBA RPG',
    prompt: 'Game Boy Advance RPG-style sprite, bright readable colors, compact proportions, clean game-ready shading',
  },
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    prompt: 'dark fantasy 2D game sprite, moody palette, readable silhouette, stylized armor or creature detail, game asset style',
  },
  {
    id: 'cute-chibi',
    name: 'Cute Chibi',
    prompt: 'cute chibi 2D game sprite, simplified proportions, expressive shape language, clean readable design',
  },
  {
    id: 'monochrome-1bit',
    name: '1-bit Monochrome',
    prompt: '1-bit monochrome pixel art sprite, black and white only, strong silhouette, clean dithering, retro handheld style',
  },
] as const

export type StylePreset = typeof STYLE_PRESETS[number]

const VARIANT_DIRECTIONS = [
  'Variant 1: most faithful to the original silhouette.',
  'Variant 2: slightly more stylized and expressive.',
  'Variant 3: stronger game-ready pixel-art interpretation.',
] as const

type VariantCount = 1 | 2 | 3

export const createGenerationJobSchema = z.object({
  uploadId: z.string().uuid(),
  userPrompt: z.string().min(1).max(2000),
  stylePresetId: z.string().min(1),
  targetWidth: z.number().int().refine(v => SUPPORTED_SIZES.includes(v as typeof SUPPORTED_SIZES[number]), {
    message: `targetWidth must be one of ${SUPPORTED_SIZES.join(', ')}`,
  }),
  targetHeight: z.number().int().refine(v => SUPPORTED_SIZES.includes(v as typeof SUPPORTED_SIZES[number]), {
    message: `targetHeight must be one of ${SUPPORTED_SIZES.join(', ')}`,
  }),
  variantCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  backgroundMode: z.union([z.literal('transparent'), z.literal('plain')]).default('transparent'),
  model: z.string().trim().min(1).optional(),
})

export function getStylePresetById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(preset => preset.id === id)
}

export function getVariantDirections(count: VariantCount): string[] {
  return VARIANT_DIRECTIONS.slice(0, count)
}

export function buildGenerationPrompt(params: {
  stylePreset: { id: string; name: string; prompt: string }
  userPrompt: string
  targetWidth: number
  targetHeight: number
  variantDirection: string
  backgroundMode: 'transparent' | 'plain'
}): string {
  const { stylePreset, userPrompt, targetWidth, targetHeight, variantDirection, backgroundMode } = params

  const backgroundInstruction = backgroundMode === 'transparent'
    ? `Remove the source image background completely and output the sprite on a real transparent alpha channel.
- Do not include any white, off-white, gray, checkerboard, matte, canvas, shadow, glow, or placeholder background pixels.
- Keep only the sprite subject and its intentional interior details; all surrounding background pixels must be fully transparent.`
    : 'Use a flat plain background with strong subject separation.'

  return `Transform the provided source image into a single 2D game sprite.

Style preset:
${stylePreset.name} — ${stylePreset.prompt}

User direction:
${userPrompt}

Output target:
- Intended final sprite size: ${targetWidth}x${targetHeight}px
- Sprite should remain readable at that final size.
- The generated image may be larger, but it must be suitable for deterministic downscaling.

Variant direction:
${variantDirection}

Hard constraints:
- Preserve the main subject identity and silhouette from the source image.
- Create one centered sprite, not a scene and not a full illustration.
- ${backgroundInstruction}
- No text.
- No watermark.
- No border.
- No UI frame.
- No sprite sheet.
- No multiple characters unless explicitly requested.
- Avoid tiny details that will collapse at the target size.
- Prefer clean readable shapes.
- Prefer game asset readability over painterly detail.`
}

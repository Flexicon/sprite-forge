import { describe, expect, it } from 'vitest'

import {
  STYLE_PRESETS,
  buildGenerationPrompt,
  createGenerationJobSchema,
  getStylePresetById,
  getVariantDirections,
} from '../server/services/style-presets'

const baseJobInput = {
  uploadId: '00000000-0000-4000-8000-000000000000',
  userPrompt: 'Make it RPG ready.',
  stylePresetId: 'pixel-art',
  targetWidth: 32,
  targetHeight: 32,
  variantCount: 2,
}

describe('style presets and generation input', () => {
  it('finds style presets by id', () => {
    expect(getStylePresetById('pixel-art')?.name).toBe('Pixel Art')
    expect(getStylePresetById('missing')).toBeUndefined()
    expect(STYLE_PRESETS).toHaveLength(6)
  })

  it('allows 1, 2, and 3 variants only', () => {
    for (const variantCount of [1, 2, 3]) {
      expect(createGenerationJobSchema.safeParse({ ...baseJobInput, variantCount }).success).toBe(true)
    }

    for (const variantCount of [0, 4, 5, 6]) {
      expect(createGenerationJobSchema.safeParse({ ...baseJobInput, variantCount }).success).toBe(false)
    }
  })

  it('defaults background mode to transparent', () => {
    const parsed = createGenerationJobSchema.parse(baseJobInput)

    expect(parsed.backgroundMode).toBe('transparent')
  })

  it('rejects unsupported target sizes and long prompts', () => {
    expect(createGenerationJobSchema.safeParse({ ...baseJobInput, targetWidth: 31 }).success).toBe(false)
    expect(createGenerationJobSchema.safeParse({ ...baseJobInput, targetHeight: 31 }).success).toBe(false)
    expect(createGenerationJobSchema.safeParse({ ...baseJobInput, userPrompt: 'x'.repeat(2001) }).success).toBe(false)
  })

  it('returns variant directions for the requested count', () => {
    expect(getVariantDirections(1)).toEqual(['Variant 1: most faithful to the original silhouette.'])
    expect(getVariantDirections(3)).toHaveLength(3)
  })

  it('builds transparent-background prompts with alpha-channel constraints', () => {
    const prompt = buildGenerationPrompt({
      stylePreset: { id: 'pixel-art', name: 'Pixel Art', prompt: 'crisp pixels' },
      userPrompt: 'Remove the white background.',
      targetWidth: 16,
      targetHeight: 16,
      variantDirection: 'Variant 1: most faithful to the original silhouette.',
      backgroundMode: 'transparent',
    })

    expect(prompt).toContain('real transparent alpha channel')
    expect(prompt).toContain('Do not include any white, off-white, gray, checkerboard')
    expect(prompt).toContain('Intended final sprite size: 16x16px')
    expect(prompt).toContain('Remove the white background.')
  })

  it('builds plain-background prompts without alpha-channel instructions', () => {
    const prompt = buildGenerationPrompt({
      stylePreset: { id: 'gba-rpg', name: 'GBA RPG', prompt: 'bright colors' },
      userPrompt: 'Use a blue background.',
      targetWidth: 64,
      targetHeight: 64,
      variantDirection: 'Variant 2: slightly more stylized and expressive.',
      backgroundMode: 'plain',
    })

    expect(prompt).toContain('Use a flat plain background with strong subject separation.')
    expect(prompt).not.toContain('real transparent alpha channel')
  })
})

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100">
    <section class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:py-16">
      <nav class="mb-12 flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Local Sprite Lab</p>
          <h1 class="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Sprite Forge</h1>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink to="/jobs" class="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
            History
          </NuxtLink>
          <NuxtLink to="/settings" class="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
            Settings
          </NuxtLink>
        </div>
      </nav>

      <div class="space-y-6">
        <section class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
          <h2 class="text-xl font-bold text-slate-100">Generation mode</h2>
          <p class="mt-1 text-sm text-slate-400">
            Start from an uploaded sprite, or ask the model to invent a new sprite from your prompt.
          </p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-2xl border p-4 text-left transition"
              :class="sourceMode === 'image'
                ? 'border-cyan-500 bg-cyan-950/60 text-cyan-50'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'"
              @click="sourceMode = 'image'"
            >
              <span class="block text-sm font-bold">Transform source sprite</span>
              <span class="mt-1 block text-xs text-slate-400">Upload an image and preserve its core identity.</span>
            </button>
            <button
              type="button"
              class="rounded-2xl border p-4 text-left transition"
              :class="sourceMode === 'prompt'
                ? 'border-cyan-500 bg-cyan-950/60 text-cyan-50'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'"
              @click="sourceMode = 'prompt'"
            >
              <span class="block text-sm font-bold">Create from prompt</span>
              <span class="mt-1 block text-xs text-slate-400">Generate a brand new sprite concept with no upload.</span>
            </button>
          </div>
        </section>

        <SourceUploader v-if="sourceMode === 'image'" @uploaded="onUpload" />

        <section class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
          <h2 class="text-xl font-bold text-slate-100">Generation settings</h2>
          <p class="mt-1 text-sm text-slate-400">
            {{ settingsDescription }}
          </p>

          <div class="mt-6 grid gap-5 sm:grid-cols-2">
            <div class="sm:col-span-2 space-y-2">
              <label class="text-sm font-semibold text-slate-100">{{ promptLabel }}</label>
              <textarea
                v-model="userPrompt"
                rows="3"
                maxlength="2000"
                :placeholder="promptPlaceholder"
                class="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500"
              />
              <p class="text-xs text-slate-500">{{ userPrompt.length }}/2000</p>
              <div v-if="sourceMode === 'prompt'" class="flex flex-wrap gap-2 text-xs">
                <button
                  v-for="example in promptExamples"
                  :key="example"
                  type="button"
                  class="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-400 transition hover:border-cyan-700 hover:text-cyan-200"
                  @click="userPrompt = example"
                >
                  {{ example }}
                </button>
              </div>
            </div>

            <StylePresetSelect
              v-model="stylePresetId"
              :presets="settings?.stylePresets ?? []"
            />

            <SpriteSizeSelect
              v-model="targetSize"
              :sizes="settings?.supportedSizes ?? []"
            />

            <VariantCountSelect v-model="variantCount" />

            <div class="space-y-2">
              <label class="text-sm font-semibold text-slate-100">Background</label>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-xl border px-4 py-2 text-sm font-semibold transition"
                  :class="backgroundMode === 'transparent'
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-100'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'"
                  @click="backgroundMode = 'transparent'"
                >
                  Transparent
                </button>
                <button
                  type="button"
                  class="rounded-xl border px-4 py-2 text-sm font-semibold transition"
                  :class="backgroundMode === 'plain'
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-100'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'"
                  @click="backgroundMode = 'plain'"
                >
                  Plain
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center gap-4">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!canGenerate || isGenerating"
              @click="generate"
            >
              <span
                v-if="isGenerating"
                class="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
                aria-hidden="true"
              />
              {{ isGenerating ? 'Generating...' : 'Generate variants' }}
            </button>
            <p v-if="isGenerating" class="text-xs text-cyan-200" aria-live="polite">
              Generating {{ variantCount }} sprites. This can take a minute.
            </p>
            <p v-if="!settings?.apiKeyConfigured" class="text-xs text-amber-300">
              OpenRouter API key is not configured.
            </p>
            <p v-else-if="sourceMode === 'image' && !uploadId" class="text-xs text-slate-500">
              Upload a source image first.
            </p>
            <p v-else-if="!userPrompt.trim()" class="text-xs text-slate-500">
              Enter a prompt to generate.
            </p>
          </div>

          <p v-if="errorMessage" class="mt-4 rounded-xl border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">
            {{ errorMessage }}
          </p>
        </section>

        <div ref="resultsSection">
          <GeneratedVariantGrid
            v-if="currentJob || isGenerating"
            :variants="currentJob?.variants ?? pendingVariants"
            :job-id="currentJob?.id"
            :is-generating="isGenerating"
          />
        </div>

        <div v-if="recentJobs.length > 0" class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 class="text-lg font-bold text-slate-100">Recent jobs</h2>
          <ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="job in recentJobs" :key="job.id">
              <NuxtLink
                :to="`/jobs/${job.id}`"
                class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 transition hover:border-slate-600"
              >
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-slate-400">
                  {{ job.variantCount }}
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-100">{{ job.stylePresetId }}</p>
                  <p class="truncate text-xs text-slate-500">
                    {{ sourceModeLabel(job.sourceMode) }} — {{ job.status }} — {{ job.targetWidth }}x{{ job.targetHeight }}
                  </p>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { GenerationJob, SettingsResponse, UploadRecord } from '~/types'

const { data: settings } = await useFetch<SettingsResponse>('/api/settings')

const sourceMode = ref<'image' | 'prompt'>('image')
const uploadId = ref<string | null>(null)
const userPrompt = ref('')
const stylePresetId = ref('pixel-art')
const targetSize = ref(32)
const variantCount = ref(2)
const backgroundMode = ref<'transparent' | 'plain'>('transparent')
const isGenerating = ref(false)
const errorMessage = ref<string | null>(null)
const currentJob = ref<GenerationJob | null>(null)
const recentJobs = ref<GenerationJob[]>([])
const resultsSection = ref<HTMLElement | null>(null)
const promptExamples = [
  'Tiny cyberpunk raccoon hacker with a glowing visor',
  'Cute chibi fire mage cat holding a tiny staff',
  '1-bit dungeon skeleton guard with a round shield',
]

const settingsDescription = computed(() => sourceMode.value === 'image'
  ? 'Describe the transformation and choose the style, size, and number of variants.'
  : 'Describe the new sprite concept and choose the style, size, and number of variants.',
)

const promptLabel = computed(() => sourceMode.value === 'image' ? 'Transformation prompt' : 'Sprite concept')
const promptPlaceholder = computed(() => sourceMode.value === 'image'
  ? 'Describe the desired transformation...'
  : 'A tiny blue slime knight with a cracked helmet and glowing sword',
)

const isSourceReady = computed(() => {
  if (sourceMode.value === 'prompt') return true

  return Boolean(uploadId.value)
})

const pendingVariants = computed(() =>
  Array.from({ length: variantCount.value }, (_, index) => ({
    id: `pending-${index + 1}`,
    status: 'running',
    variantIndex: index + 1,
    variantDirection: getPendingVariantDirection(index + 1),
    finalImagePath: null,
    previewImagePath: null,
    errorMessage: null,
  })),
)

const canGenerate = computed(() => {
  if (!settings.value) return false
  if (!settings.value.apiKeyConfigured) return false
  if (!userPrompt.value.trim()) return false

  return isSourceReady.value
})

function onUpload(upload: UploadRecord) {
  uploadId.value = upload.id
  errorMessage.value = null
}

function getPendingVariantDirection(index: number): string {
  const imageDirections = [
    'Most faithful to the original silhouette.',
    'Slightly more stylized and expressive.',
    'Stronger game-ready pixel-art interpretation.',
  ]
  const promptDirections = [
    'Simple iconic interpretation with maximum readability.',
    'More expressive characterful interpretation with distinct shape language.',
    'Bolder game-ready interpretation with stronger stylization.',
  ]
  const directions = sourceMode.value === 'prompt' ? promptDirections : imageDirections

  return directions[index - 1] ?? 'Sprite variation in progress.'
}

function sourceModeLabel(mode: GenerationJob['sourceMode']) {
  return mode === 'prompt' ? 'Prompt-created' : 'Source transform'
}

async function loadRecentJobs() {
  try {
    const response = await $fetch<{ jobs: GenerationJob[] }>('/api/generation-jobs', {
      query: { lite: '1', limit: '5' },
    })
    recentJobs.value = response.jobs
  }
  catch {
    // Silently ignore recent job load failures
  }
}

// fallow-ignore-next-line complexity
async function generate() {
  if (!canGenerate.value) return

  isGenerating.value = true
  errorMessage.value = null
  currentJob.value = null
  await nextTick()
  resultsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  try {
    const response = await $fetch<{ job: GenerationJob }>('/api/generation-jobs', {
      method: 'POST',
      body: {
        sourceMode: sourceMode.value,
        uploadId: sourceMode.value === 'image' ? uploadId.value : undefined,
        userPrompt: userPrompt.value.trim(),
        stylePresetId: stylePresetId.value,
        targetWidth: targetSize.value,
        targetHeight: targetSize.value,
        variantCount: variantCount.value,
        backgroundMode: backgroundMode.value,
      },
    })

    currentJob.value = response.job
    await loadRecentJobs()
  }
  catch (error: unknown) {
    const err = error as { statusMessage?: string; message?: string }
    errorMessage.value = err?.statusMessage || err?.message || 'Generation failed.'
  }
  finally {
    isGenerating.value = false
  }
}

onMounted(() => {
  loadRecentJobs()
})
</script>

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

      <div class="grid flex-1 gap-6 lg:grid-cols-[1fr_380px]">
        <!-- Left column: controls and results -->
        <div class="space-y-6">
          <SourceUploader @uploaded="onUpload" />

          <section class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
            <h2 class="text-xl font-bold text-slate-100">Generation settings</h2>
            <p class="mt-1 text-sm text-slate-400">
              Describe the transformation and choose the style, size, and number of variants.
            </p>

            <div class="mt-6 grid gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2 space-y-2">
                <label class="text-sm font-semibold text-slate-100">Prompt</label>
                <textarea
                  v-model="userPrompt"
                  rows="3"
                  placeholder="Describe the desired transformation..."
                  class="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500"
                />
                <p class="text-xs text-slate-500">{{ userPrompt.length }}/2000</p>
              </div>

              <StylePresetSelect
                v-model="stylePresetId"
                :presets="settings?.stylePresets ?? []"
              />

              <div class="grid grid-cols-2 gap-3">
                <SpriteSizeSelect
                  v-model="targetWidth"
                  :sizes="settings?.supportedSizes ?? []"
                  label="Width"
                />
                <SpriteSizeSelect
                  v-model="targetHeight"
                  :sizes="settings?.supportedSizes ?? []"
                  label="Height"
                />
              </div>

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
                class="rounded-full bg-cyan-300 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canGenerate || isGenerating"
                @click="generate"
              >
                {{ isGenerating ? 'Generating...' : 'Generate variants' }}
              </button>
              <p v-if="!settings?.apiKeyConfigured" class="text-xs text-amber-300">
                OpenRouter API key is not configured.
              </p>
              <p v-else-if="!uploadId" class="text-xs text-slate-500">
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

          <GeneratedVariantGrid
            v-if="currentJob"
            :variants="currentJob.variants"
            :job-id="currentJob.id"
          />
        </div>

        <!-- Right column: info and recent jobs -->
        <aside class="space-y-6">
          <div class="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <h2 class="text-xl font-bold">MVP Scope</h2>
            <ul class="mt-5 space-y-3 text-sm text-slate-300">
              <li class="rounded-xl bg-slate-900 p-3">Local-first Nuxt app, no auth or SaaS assumptions.</li>
              <li class="rounded-xl bg-slate-900 p-3">OpenRouter image generation, one model call per variant.</li>
              <li class="rounded-xl bg-slate-900 p-3">Sharp post-processing into exact target-size PNG sprites.</li>
              <li class="rounded-xl bg-slate-900 p-3">SQLite metadata with filesystem image storage.</li>
            </ul>
          </div>

          <div v-if="recentJobs.length > 0" class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 class="text-lg font-bold text-slate-100">Recent jobs</h2>
            <ul class="mt-4 space-y-3">
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
                      {{ job.status }} — {{ job.targetWidth }}x{{ job.targetHeight }}
                    </p>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { GenerationJob, SettingsResponse, UploadRecord } from '~/types'

const { data: settings } = await useFetch<SettingsResponse>('/api/settings')

const uploadId = ref<string | null>(null)
const userPrompt = ref('')
const stylePresetId = ref('pixel-art')
const targetWidth = ref(32)
const targetHeight = ref(32)
const variantCount = ref(4)
const backgroundMode = ref<'transparent' | 'plain'>('transparent')
const isGenerating = ref(false)
const errorMessage = ref<string | null>(null)
const currentJob = ref<GenerationJob | null>(null)
const recentJobs = ref<GenerationJob[]>([])

const canGenerate = computed(() => {
  return uploadId.value && userPrompt.value.trim().length > 0 && settings.value?.apiKeyConfigured
})

function onUpload(upload: UploadRecord) {
  uploadId.value = upload.id
  errorMessage.value = null
}

async function loadRecentJobs() {
  try {
    const response = await $fetch<{ jobs: GenerationJob[] }>('/api/generation-jobs')
    recentJobs.value = response.jobs.slice(0, 5)
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

  try {
    const response = await $fetch<{ job: GenerationJob }>('/api/generation-jobs', {
      method: 'POST',
      body: {
        uploadId: uploadId.value,
        userPrompt: userPrompt.value.trim(),
        stylePresetId: stylePresetId.value,
        targetWidth: targetWidth.value,
        targetHeight: targetHeight.value,
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

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100">
    <section class="mx-auto w-full max-w-6xl px-6 py-10 sm:py-16">
      <nav class="mb-10 flex items-center justify-between gap-4">
        <div>
          <NuxtLink to="/" class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Sprite Forge</NuxtLink>
          <h1 class="mt-2 text-3xl font-black tracking-tight">Job Details</h1>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink to="/jobs" class="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
            History
          </NuxtLink>
          <NuxtLink to="/" class="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
            Workspace
          </NuxtLink>
        </div>
      </nav>

      <div v-if="pending" class="text-sm text-slate-500">Loading job...</div>
      <div v-else-if="error || !job" class="rounded-xl border border-red-800 bg-red-950/60 p-4 text-sm text-red-200">
        Job not found or failed to load.
      </div>
      <div v-else class="space-y-8">
        <!-- Job header -->
        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div class="flex flex-wrap items-center gap-3">
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="statusBadgeClass(job.status)"
            >
              {{ job.status }}
            </span>
            <span class="text-sm text-slate-400">{{ job.stylePresetId }} — {{ job.targetWidth }}x{{ job.targetHeight }} — {{ job.variantCount }} variants</span>
          </div>
          <p class="mt-3 text-sm text-slate-300">{{ job.userPrompt }}</p>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <a
              v-if="completedVariants.length > 0"
              :href="zipUrl"
              class="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Download all ZIP
            </a>
            <span class="text-xs text-slate-500">{{ formatDate(job.createdAt) }}</span>
          </div>
          <p v-if="job.errorMessage" class="mt-3 rounded-xl border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">
            {{ job.errorMessage }}
          </p>
        </div>

        <!-- Source image -->
        <div v-if="job.upload" class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 class="text-lg font-bold text-slate-100">Source image</h2>
          <div class="mt-4 flex min-h-48 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-4">
            <img
              :src="`/api/uploads/${job.upload.id}/image.png`"
              alt="Source sprite"
              class="max-h-48 max-w-full rounded-lg object-contain [image-rendering:pixelated]"
            >
          </div>
          <p class="mt-2 text-sm text-slate-400">
            {{ job.upload.originalFilename }} — {{ job.upload.width }}x{{ job.upload.height }}
          </p>
        </div>

        <!-- Variants -->
        <GeneratedVariantGrid
          :variants="job.variants"
          :job-id="job.id"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { GenerationJob } from '~/types'
import { statusBadgeClass, formatDate } from '~/types'

const route = useRoute()
const jobId = computed(() => route.params.id as string)

const { data: jobData, pending, error } = await useFetch<{ job: GenerationJob }>(`/api/generation-jobs/${jobId.value}`)
const job = computed(() => jobData.value?.job ?? null)

const completedVariants = computed(() =>
  job.value?.variants.filter(v => v.status === 'completed') ?? [],
)

const zipUrl = computed(() =>
  job.value ? `/api/generation-jobs/${job.value.id}/download.zip` : '',
)
</script>

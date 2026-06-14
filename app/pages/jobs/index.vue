<template>
  <main class="min-h-screen bg-slate-950 text-slate-100">
    <section class="mx-auto w-full max-w-6xl px-6 py-10 sm:py-16">
      <nav class="mb-10 flex items-center justify-between gap-4">
        <div>
          <NuxtLink to="/" class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Sprite Forge</NuxtLink>
          <h1 class="mt-2 text-3xl font-black tracking-tight">Generation History</h1>
        </div>
        <NuxtLink to="/" class="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
          Back to workspace
        </NuxtLink>
      </nav>

      <div v-if="pending" class="text-sm text-slate-500">Loading jobs...</div>
      <div v-else-if="error" class="rounded-xl border border-red-800 bg-red-950/60 p-4 text-sm text-red-200">
        Failed to load jobs.
      </div>
      <div v-else-if="jobs.length === 0" class="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center text-sm text-slate-500">
        No generation jobs yet.
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-600"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <span
                  class="rounded-full px-3 py-1 text-xs font-bold"
                  :class="statusBadgeClass(job.status)"
                >
                  {{ job.status }}
                </span>
                <span class="text-sm text-slate-500">{{ job.stylePresetId }}</span>
              </div>
              <p class="mt-2 text-sm text-slate-300">
                {{ job.targetWidth }}x{{ job.targetHeight }} — {{ job.variantCount }} variants
              </p>
              <p class="mt-1 truncate text-xs text-slate-500">
                {{ job.userPrompt }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-500">{{ formatDate(job.createdAt) }}</span>
              <NuxtLink
                :to="`/jobs/${job.id}`"
                class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                View
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { GenerationJob } from '~/types'
import { statusBadgeClass, formatDate } from '~/types'

const { data: jobsData, pending, error } = await useFetch<{ jobs: GenerationJob[] }>('/api/generation-jobs')
const jobs = computed(() => jobsData.value?.jobs ?? [])
</script>

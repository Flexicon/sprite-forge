<script setup lang="ts">
type Variant = {
  id: string
  status: string
  variantIndex: number
  variantDirection: string
  finalImagePath: string | null
  previewImagePath: string | null
  errorMessage: string | null
}

const props = defineProps<{
  variants: Variant[]
  jobId?: string
  isGenerating?: boolean
}>()

function getPreviewUrl(variantId: string): string {
  return `/api/variants/${variantId}/preview.png`
}

function getDownloadUrl(variantId: string): string {
  return `/api/variants/${variantId}/download.png`
}

function getZipUrl(jobId: string): string {
  return `/api/generation-jobs/${jobId}/download.zip`
}

const completedVariants = computed(() =>
  props.variants.filter(v => v.status === 'completed'),
)

const failedVariants = computed(() =>
  props.variants.filter(v => v.status === 'failed'),
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-bold text-slate-100">
          {{ isGenerating ? 'Generating variants' : 'Generated variants' }}
        </h3>
        <p v-if="isGenerating" class="mt-1 text-sm text-slate-400" aria-live="polite">
          Preparing {{ variants.length }} sprite slots. Results will appear here when generation finishes.
        </p>
      </div>
      <a
        v-if="jobId && completedVariants.length > 0"
        :href="getZipUrl(jobId)"
        class="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
      >
        Download all ZIP
      </a>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="variant in variants"
        :key="variant.id"
        class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
      >
        <div class="flex min-h-48 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2">
          <img
            v-if="variant.status === 'completed' && variant.previewImagePath"
            :src="getPreviewUrl(variant.id)"
            :alt="`Variant ${variant.variantIndex}`"
            class="max-h-44 max-w-full rounded-lg object-contain [image-rendering:pixelated]"
          >
          <div v-else-if="variant.status === 'failed'" class="text-center text-sm text-red-300">
            <p class="font-semibold">Failed</p>
            <p class="mt-1 text-xs text-red-400/80">{{ variant.errorMessage || 'Unknown error' }}</p>
          </div>
          <div v-else class="w-full space-y-4 text-center text-sm text-slate-500">
            <div class="mx-auto grid h-28 w-28 animate-pulse place-items-center rounded-lg border border-cyan-900/50 bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950/40">
              <div class="h-12 w-12 rounded-md border border-cyan-500/30 bg-cyan-300/10 shadow-lg shadow-cyan-500/10" />
            </div>
            <div>
              <p class="font-semibold text-cyan-200">Generating variant {{ variant.variantIndex }}...</p>
              <p class="mt-1 text-xs text-slate-500">Waiting for image output</p>
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-100">Variant {{ variant.variantIndex }}</p>
            <p class="truncate text-xs text-slate-500">{{ variant.variantDirection }}</p>
          </div>
          <div v-if="variant.status === 'completed'" class="flex shrink-0 items-center gap-2">
            <NuxtLink
              :to="`/editor?variantId=${variant.id}`"
              class="rounded-lg border border-cyan-800 bg-cyan-950/60 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:border-cyan-500 hover:text-white"
            >
              Edit
            </NuxtLink>
            <a
              :href="getDownloadUrl(variant.id)"
              class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              download
            >
              PNG
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="failedVariants.length > 0" class="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
      <p class="font-semibold">
        {{ failedVariants.length }} variant(s) failed.
      </p>
      <p class="mt-1 text-xs text-red-300/80">
        Completed variants are still available above. Check the server logs for full error details.
      </p>
    </div>
  </div>
</template>

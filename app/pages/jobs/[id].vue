<template>
  <AppShell title="Job Details">

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
            <span class="text-sm text-slate-400">{{ sourceModeLabel(job.sourceMode) }} — {{ job.stylePresetId }} — {{ job.targetWidth }}x{{ job.targetHeight }} — {{ job.variantCount }} variants</span>
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
            <button
              type="button"
              :disabled="isDeleting"
              class="rounded-full border border-red-800 bg-red-950/60 px-4 py-2 text-sm font-bold text-red-200 transition hover:border-red-600 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-60"
              @click="deleteJob"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete job' }}
            </button>
            <span class="text-xs text-slate-500">{{ formatDate(job.createdAt) }}</span>
          </div>
          <p v-if="deleteError" class="mt-3 rounded-xl border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">
            {{ deleteError }}
          </p>
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

        <div v-else class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 class="text-lg font-bold text-slate-100">Prompt-created sprite</h2>
          <p class="mt-2 text-sm text-slate-400">
            This job was generated from the prompt and settings only, with no source image.
          </p>
        </div>

        <!-- Variants -->
        <GeneratedVariantGrid
          :variants="job.variants"
          :job-id="job.id"
        />
      </div>
  </AppShell>
</template>

<script setup lang="ts">
import type { GenerationJob } from '~/types'
import { statusBadgeClass, formatDate } from '~/types'

const route = useRoute()
const router = useRouter()
const jobId = computed(() => route.params.id as string)
const isDeleting = ref(false)
const deleteError = ref('')

const { data: jobData, pending, error } = await useFetch<{ job: GenerationJob }>(`/api/generation-jobs/${jobId.value}`)
const job = computed(() => jobData.value?.job ?? null)

const completedVariants = computed(() =>
  job.value?.variants.filter(v => v.status === 'completed') ?? [],
)

const zipUrl = computed(() =>
  job.value ? `/api/generation-jobs/${job.value.id}/download.zip` : '',
)

function sourceModeLabel(mode: GenerationJob['sourceMode']) {
  return mode === 'prompt' ? 'Prompt-created' : 'Source transform'
}

async function destroyJob(currentJobId: string) {
  isDeleting.value = true
  deleteError.value = ''

  const deleted = await $fetch(`/api/generation-jobs/${currentJobId}`, { method: 'DELETE' })
    .then(() => true)
    .catch(() => false)

  isDeleting.value = false

  if (!deleted) {
    deleteError.value = 'Failed to delete job.'
    return
  }

  await router.push('/jobs')
}

function getDeletableJobId() {
  if (isDeleting.value) {
    return ''
  }

  return job.value?.id ?? ''
}

function deleteJob() {
  const currentJobId = getDeletableJobId()
  if (!currentJobId) {
    return
  }

  if (!window.confirm('Delete this job and its stored files? This cannot be undone.')) {
    return
  }

  void destroyJob(currentJobId)
}
</script>

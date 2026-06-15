<template>
  <AppShell title="Sprite Editor">
      <div class="space-y-6">
        <section class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 class="text-xl font-bold text-slate-100">Open a sprite</h2>
              <p class="mt-2 max-w-2xl text-sm text-slate-400">
                Open a completed generated variant from job history, or upload a standalone image here. Pixel editing tools arrive in the next phase.
              </p>
            </div>
            <NuxtLink
              to="/jobs"
              class="inline-flex w-fit rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Browse jobs
            </NuxtLink>
          </div>
        </section>

        <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-bold text-slate-100">Editor preview</h2>
                <p class="mt-1 text-sm text-slate-500">{{ sourceDescription }}</p>
              </div>
              <a
                v-if="imageUrl"
                :href="imageUrl"
                class="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                download
              >
                Download source PNG
              </a>
            </div>

            <div class="mt-6 flex min-h-[24rem] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <img
                v-if="imageUrl"
                :key="imageUrl"
                :src="imageUrl"
                alt="Sprite selected for editing"
                class="max-h-[32rem] max-w-full rounded-lg object-contain [image-rendering:pixelated]"
                @error="onImageError"
                @load="onImageLoad"
              >
              <div v-else class="max-w-sm text-center text-sm text-slate-500">
                <p class="font-semibold text-slate-300">No sprite selected yet.</p>
                <p class="mt-2">Use an `Edit` link from a completed variant, browse job history, or upload an image below.</p>
              </div>
            </div>

            <div v-if="imageError" class="mt-4 rounded-xl border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">
              {{ imageError }}
            </div>

            <dl v-if="imageUrl" class="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300 sm:grid-cols-3">
              <div>
                <dt class="text-xs uppercase tracking-widest text-slate-500">Source</dt>
                <dd class="mt-1 font-medium text-slate-100">{{ sourceTypeLabel }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-widest text-slate-500">ID</dt>
                <dd class="mt-1 break-all font-medium text-slate-100">{{ sourceId }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-widest text-slate-500">Dimensions</dt>
                <dd class="mt-1 font-medium text-slate-100">{{ imageDimensions }}</dd>
              </div>
            </dl>
          </div>

          <div class="space-y-6">
            <SourceUploader compact @uploaded="onUpload" />

            <section class="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 class="text-lg font-bold text-slate-100">Phase 1 status</h2>
              <p class="mt-2 text-sm text-slate-400">
                This page can load sprites and uploads. Drawing tools, save-as-edit, grid, and undo/redo are planned for the next phases.
              </p>
            </section>
          </div>
        </section>
      </div>
  </AppShell>
</template>

<script setup lang="ts">
import type { UploadRecord } from '~/types'

const route = useRoute()
const router = useRouter()
const imageError = ref('')
const naturalWidth = ref<number | null>(null)
const naturalHeight = ref<number | null>(null)

const variantId = computed(() => getQueryValue(route.query.variantId))
const uploadId = computed(() => getQueryValue(route.query.uploadId))
const sourceKind = computed<'variant' | 'upload' | null>(() => {
  if (variantId.value) return 'variant'
  if (uploadId.value) return 'upload'

  return null
})
const sourceId = computed(() => variantId.value || uploadId.value || 'None')
const imageUrl = computed(() => {
  if (variantId.value) return `/api/variants/${variantId.value}/image.png`
  if (uploadId.value) return `/api/uploads/${uploadId.value}/image.png`

  return ''
})
const sourceTypeLabel = computed(() => {
  if (sourceKind.value === 'variant') return 'Generated variant'
  if (sourceKind.value === 'upload') return 'Direct upload'

  return 'None'
})
const sourceDescription = computed(() => {
  if (sourceKind.value === 'variant') return 'Loaded from a completed generated variant.'
  if (sourceKind.value === 'upload') return 'Loaded from a direct image upload.'

  return 'Choose a sprite to begin.'
})
const imageDimensions = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return 'Loading...'

  return `${naturalWidth.value}x${naturalHeight.value}`
})

function getQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return typeof value === 'string' ? value : ''
}

function resetImageState() {
  imageError.value = ''
  naturalWidth.value = null
  naturalHeight.value = null
}

function onImageLoad(event: Event) {
  const image = event.target as HTMLImageElement
  imageError.value = ''
  naturalWidth.value = image.naturalWidth
  naturalHeight.value = image.naturalHeight
}

function onImageError() {
  imageError.value = 'Failed to load the selected sprite image.'
  naturalWidth.value = null
  naturalHeight.value = null
}

async function onUpload(upload: UploadRecord) {
  await router.replace({ path: '/editor', query: { uploadId: upload.id } })
}

watch(imageUrl, resetImageState)
</script>

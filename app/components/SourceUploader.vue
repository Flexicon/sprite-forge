<script setup lang="ts">
type UploadRecord = {
  id: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  width: number
  height: number
  storagePath: string
  createdAt: string
}

type UploadResponse = {
  upload: UploadRecord
  warning: string | null
}

const emit = defineEmits<{
  uploaded: [upload: UploadRecord]
}>()

defineProps<{
  compact?: boolean
}>()

const fileInputId = 'source-upload-file'
const previewUrl = ref<string | null>(null)
const upload = ref<UploadRecord | null>(null)
const warning = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const isUploading = ref(false)

function clearPreviewUrl() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getFetchErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Upload failed.'
}

async function uploadFile(file: File) {
  clearPreviewUrl()
  previewUrl.value = URL.createObjectURL(file)
  upload.value = null
  warning.value = null
  errorMessage.value = null
  isUploading.value = true

  const form = new FormData()
  form.append('file', file)

  try {
    const response = await $fetch<UploadResponse>('/api/uploads', {
      method: 'POST',
      body: form,
    })

    upload.value = response.upload
    warning.value = response.warning
    emit('uploaded', response.upload)
  }
  catch (error) {
    errorMessage.value = getFetchErrorMessage(error)
  }
  finally {
    isUploading.value = false
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    void uploadFile(file)
  }
}

onBeforeUnmount(clearPreviewUrl)
</script>

<template>
  <section class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-100">Source sprite</h2>
        <p class="mt-2 text-sm text-slate-400">Upload a PNG, JPEG, or WebP image up to 10 MB.</p>
      </div>
      <label
        :for="fileInputId"
        class="whitespace-nowrap rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        :class="isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
      >
        {{ isUploading ? 'Uploading...' : 'Choose image' }}
      </label>
    </div>

    <input
      :id="fileInputId"
      class="sr-only"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      :disabled="isUploading"
      @change="onFileChange"
    >

    <div
      v-if="previewUrl || upload || warning || errorMessage"
      class="mt-5 grid gap-5"
      :class="compact ? '' : 'md:grid-cols-[220px_1fr]'"
    >
      <div v-if="previewUrl" class="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-4">
        <img
          :src="previewUrl"
          alt="Uploaded source sprite preview"
          class="max-h-48 max-w-full rounded-lg object-contain [image-rendering:pixelated]"
        >
      </div>

      <div class="space-y-3 text-sm">
        <p v-if="errorMessage" class="rounded-xl border border-red-800 bg-red-950/60 p-3 text-red-200">
          {{ errorMessage }}
        </p>
        <p v-if="warning" class="rounded-xl border border-amber-700 bg-amber-950/50 p-3 text-amber-100">
          {{ warning }}
        </p>

        <dl v-if="upload" class="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-300">
          <div>
            <dt class="text-xs uppercase tracking-widest text-slate-500">Filename</dt>
            <dd class="mt-1 break-all font-medium text-slate-100">{{ upload.originalFilename }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-widest text-slate-500">Dimensions</dt>
            <dd class="mt-1 font-medium text-slate-100">{{ upload.width }}x{{ upload.height }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-widest text-slate-500">Type</dt>
            <dd class="mt-1 font-medium text-slate-100">{{ upload.mimeType }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-widest text-slate-500">Size</dt>
            <dd class="mt-1 font-medium text-slate-100">{{ formatBytes(upload.sizeBytes) }}</dd>
          </div>
        </dl>

      </div>
    </div>
  </section>
</template>

export type UploadRecord = {
  id: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  width: number
  height: number
  storagePath: string
  createdAt: string
}

export type Variant = {
  id: string
  status: string
  variantIndex: number
  variantDirection: string
  finalImagePath: string | null
  previewImagePath: string | null
  errorMessage: string | null
}

export type SpriteEdit = {
  id: string
  sourceType: 'variant' | 'upload' | 'edit'
  sourceId: string
  width: number
  height: number
  storagePath: string
  createdAt: string
}

export type GenerationJob = {
  id: string
  uploadId: string | null
  sourceMode: 'image' | 'prompt'
  status: string
  model: string
  userPrompt: string
  stylePresetId: string
  stylePrompt: string
  targetWidth: number
  targetHeight: number
  variantCount: number
  backgroundMode: string
  createdAt: string
  errorMessage: string | null
  variants: Variant[]
  upload?: UploadRecord
}

export type StylePreset = {
  id: string
  name: string
  prompt: string
}

export type SettingsResponse = {
  model: string
  apiKeyConfigured: boolean
  storageDir: string
  database: { ok: boolean; path: string }
  storage: { ok: boolean; path: string }
  stylePresets: StylePreset[]
  supportedSizes: number[]
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case 'completed': return 'bg-emerald-950 text-emerald-300 border border-emerald-800'
    case 'failed': return 'bg-red-950 text-red-300 border border-red-800'
    case 'running': return 'bg-amber-950 text-amber-300 border border-amber-800'
    default: return 'bg-slate-800 text-slate-400 border border-slate-700'
  }
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}

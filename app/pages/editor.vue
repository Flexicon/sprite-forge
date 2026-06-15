<template>
  <AppShell title="Sprite Editor">
    <div class="space-y-6">
      <section v-if="!imageUrl" class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-100">Open a sprite</h2>
            <p class="mt-2 max-w-2xl text-sm text-slate-400">
              Open a completed generated variant from job history, or upload a standalone image here for quick pixel touchups.
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
              <h2 class="text-xl font-bold text-slate-100">Canvas editor</h2>
              <p class="mt-1 text-sm text-slate-500">{{ sourceDescription }}</p>
            </div>
            <div v-if="canvasReady" class="flex flex-wrap gap-2">
              <button
                type="button"
                :disabled="isSavingEdit"
                class="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                @click="saveEditedSprite"
              >
                {{ isSavingEdit ? 'Saving...' : 'Save copy' }}
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                @click="downloadEditedPng"
              >
                Download edited PNG
              </button>
            </div>
          </div>

          <div class="mt-6 flex min-h-[24rem] items-center justify-center overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div v-if="imageUrl" class="max-w-full">
              <div class="relative inline-block rounded-lg border border-slate-700" :style="canvasFrameStyle">
                <canvas
                  ref="displayCanvas"
                  class="relative z-10 block rounded-lg bg-transparent [image-rendering:pixelated]"
                  :class="activeTool === 'eyedropper' ? 'cursor-crosshair' : 'cursor-pencil'"
                  :style="canvasStyle"
                  aria-label="Editable sprite canvas"
                  @contextmenu.prevent
                  @pointerdown="onPointerDown"
                  @pointermove="onPointerMove"
                  @pointerup="onPointerUp"
                  @pointercancel="onPointerUp"
                  @pointerleave="onPointerUp"
                />
                <div v-if="showGrid" class="pointer-events-none absolute inset-0 z-20 rounded-lg" :style="gridStyle" />
              </div>
              <p v-if="canvasReady" class="mt-3 text-center text-xs text-slate-500">
                Editing {{ imageDimensions }} at {{ previewScale }}x zoom.
              </p>
            </div>
            <div v-else class="max-w-sm text-center text-sm text-slate-500">
              <p class="font-semibold text-slate-300">No sprite selected yet.</p>
              <p class="mt-2">Use an `Edit` link from a completed variant, browse job history, or upload an image below.</p>
            </div>
          </div>

          <div v-if="imageError" class="mt-4 rounded-xl border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">
            {{ imageError }}
          </div>
          <div v-if="editorMessage" class="mt-4 rounded-xl border border-cyan-900 bg-cyan-950/40 p-3 text-sm text-cyan-100">
            {{ editorMessage }}
            <span v-if="savedEditId">
              <NuxtLink :to="`/editor?editId=${savedEditId}`" class="ml-2 font-bold text-cyan-200 underline decoration-cyan-500/60 underline-offset-4">Open saved edit</NuxtLink>
              <a :href="`/api/sprite-edits/${savedEditId}/download.png`" class="ml-2 font-bold text-cyan-200 underline decoration-cyan-500/60 underline-offset-4">Download saved PNG</a>
            </span>
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
          <SourceUploader compact hide-details @uploaded="onUpload" />

          <section class="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 class="text-lg font-bold text-slate-100">Tools</h2>
            <div v-if="canvasReady" class="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
              <p>
                <span class="text-slate-500">Active:</span>
                {{ activeToolLabel }} / {{ selectedColor }} / {{ brushSize }}px brush / {{ previewScale }}x zoom
              </p>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                :disabled="!canUndo"
                :class="historyButtonClass(canUndo)"
                @click="undoEdit"
              >
                Undo
              </button>
              <button
                type="button"
                :disabled="!canRedo"
                :class="historyButtonClass(canRedo)"
                @click="redoEdit"
              >
                Redo
              </button>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2">
              <button
                v-for="tool in tools"
                :key="tool.id"
                type="button"
                :class="toolButtonClass(tool.id)"
                @click="activeTool = tool.id"
              >
                {{ tool.label }}
              </button>
            </div>

            <label class="mt-5 block text-sm font-semibold text-slate-200" for="editor-color">Color</label>
            <div class="mt-2 flex items-center gap-3">
              <input
                id="editor-color"
                v-model="selectedColor"
                type="color"
                class="h-10 w-16 rounded-lg border border-slate-700 bg-slate-950 p-1"
              >
              <span class="font-mono text-sm text-slate-300">{{ selectedColor }}</span>
            </div>

            <fieldset class="mt-5">
              <legend class="text-sm font-semibold text-slate-200">Brush size</legend>
              <div class="mt-2 flex gap-2">
                <button
                  v-for="size in brushSizes"
                  :key="size"
                  type="button"
                  :class="brushButtonClass(size)"
                  @click="brushSize = size"
                >
                  {{ size }}px
                </button>
              </div>
            </fieldset>

            <fieldset class="mt-5">
              <legend class="text-sm font-semibold text-slate-200">Zoom</legend>
              <div class="mt-2 flex flex-wrap gap-2">
                <button type="button" :class="zoomButtonClass" @click="zoomOut">-</button>
                <button
                  v-for="scale in zoomScales"
                  :key="scale"
                  type="button"
                  :class="zoomScaleButtonClass(scale)"
                  @click="zoomScale = scale"
                >
                  {{ scale }}x
                </button>
                <button type="button" :class="zoomButtonClass" @click="zoomIn">+</button>
              </div>
            </fieldset>

            <label class="mt-5 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold text-slate-200">
              <input v-model="showGrid" type="checkbox" class="size-4 rounded border-slate-700 bg-slate-950">
              Show pixel grid
            </label>

            <p class="mt-5 text-xs leading-5 text-slate-500">
              Pencil paints with the selected color. Eraser clears pixels to transparent. Eyedropper samples the clicked pixel color.
              Shortcuts: P pencil, E eraser, I eyedropper, G grid, Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo.
            </p>
          </section>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import type { SpriteEdit, UploadRecord } from '~/types'

type EditorTool = 'pencil' | 'eraser' | 'eyedropper'
type CanvasPoint = { x: number, y: number }
type CanvasPair = {
  backingCanvas: HTMLCanvasElement
  backingContext: CanvasRenderingContext2D
  visibleCanvas: HTMLCanvasElement
  visibleContext: CanvasRenderingContext2D
}
type VisibleCanvasPair = Pick<CanvasPair, 'backingCanvas' | 'visibleCanvas' | 'visibleContext'>
type EditableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
type SaveSource = { sourceType: 'variant' | 'upload' | 'edit', sourceId: string }

const route = useRoute()
const router = useRouter()
const displayCanvas = ref<HTMLCanvasElement | null>(null)
const editCanvas = shallowRef<HTMLCanvasElement | null>(null)
const imageError = ref('')
const editorMessage = ref('')
const naturalWidth = ref<number | null>(null)
const naturalHeight = ref<number | null>(null)
const canvasReady = ref(false)
const isDrawing = ref(false)
const isSavingEdit = ref(false)
const savedEditId = ref('')
const selectedColor = ref('#38bdf8')
const activeTool = ref<EditorTool>('pencil')
const brushSize = ref<1 | 2 | 4>(1)
const zoomScale = ref(16)
const showGrid = ref(true)
const undoStack = shallowRef<ImageData[]>([])
const redoStack = shallowRef<ImageData[]>([])

const tools: { id: EditorTool, label: string }[] = [
  { id: 'pencil', label: 'Pencil' },
  { id: 'eraser', label: 'Eraser' },
  { id: 'eyedropper', label: 'Pick' },
]
const brushSizes = [1, 2, 4] as const
const zoomScales = [4, 8, 12, 16, 24, 32] as const
const maxHistoryEntries = 40
const historyShortcutActions: Record<string, () => void> = {
  z: undoEdit,
  'shift+z': redoEdit,
  y: redoEdit,
}
const variantId = computed(() => getQueryValue(route.query.variantId))
const uploadId = computed(() => getQueryValue(route.query.uploadId))
const editId = computed(() => getQueryValue(route.query.editId))
const sourceKind = computed<'variant' | 'upload' | 'edit' | null>(() => {
  if (variantId.value) return 'variant'
  if (uploadId.value) return 'upload'
  if (editId.value) return 'edit'

  return null
})
const sourceId = computed(() => variantId.value || uploadId.value || editId.value || 'None')
const imageUrl = computed(() => {
  if (variantId.value) return `/api/variants/${variantId.value}/image.png`
  if (uploadId.value) return `/api/uploads/${uploadId.value}/image.png`
  if (editId.value) return `/api/sprite-edits/${editId.value}/image.png`

  return ''
})
const sourceTypeLabel = computed(() => {
  if (sourceKind.value === 'variant') return 'Generated variant'
  if (sourceKind.value === 'upload') return 'Direct upload'
  if (sourceKind.value === 'edit') return 'Saved edit'

  return 'None'
})
const sourceDescription = computed(() => {
  if (sourceKind.value === 'variant') return 'Loaded from a completed generated variant.'
  if (sourceKind.value === 'upload') return 'Loaded from a direct image upload.'
  if (sourceKind.value === 'edit') return 'Loaded from a saved edited sprite.'

  return 'Choose a sprite to begin.'
})
const imageDimensions = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return 'Loading...'

  return `${naturalWidth.value}x${naturalHeight.value}`
})
const previewScale = computed(() => {
  return zoomScale.value
})
const canvasStyle = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return {}

  return {
    width: `${naturalWidth.value * previewScale.value}px`,
    height: `${naturalHeight.value * previewScale.value}px`,
    touchAction: 'none',
  }
})
const canvasFrameStyle = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return {}

  return {
    ...canvasStyle.value,
    backgroundColor: '#1e293b',
    backgroundImage: 'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
    backgroundSize: '16px 16px',
  }
})
const gridStyle = computed(() => {
  const scale = previewScale.value

  return {
    backgroundImage: 'linear-gradient(to right, rgba(148, 163, 184, 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
    backgroundSize: `${scale}px ${scale}px`,
  }
})
const activeToolLabel = computed(() => tools.find(tool => tool.id === activeTool.value)?.label || activeTool.value)
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

let loadToken = 0

function getQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return typeof value === 'string' ? value : ''
}

function resetImageState() {
  imageError.value = ''
  editorMessage.value = ''
  naturalWidth.value = null
  naturalHeight.value = null
  canvasReady.value = false
  isDrawing.value = false
  isSavingEdit.value = false
  savedEditId.value = ''
  undoStack.value = []
  redoStack.value = []
}

async function loadImageToCanvas(url: string) {
  const token = ++loadToken
  resetImageState()

  if (!url || !import.meta.client) return

  try {
    const image = await decodeSourceImage(url)
    await renderDecodedImage(image, token)
  } catch {
    setCurrentLoadError(token, 'Failed to load the selected sprite image.')
  }
}

function setCurrentLoadError(token: number, message: string) {
  if (token === loadToken) imageError.value = message
}

async function decodeSourceImage(url: string) {
  const image = new Image()
  image.decoding = 'async'
  image.src = url
  await image.decode()
  return image
}

async function renderDecodedImage(image: HTMLImageElement, token: number) {
  if (token !== loadToken) return
  await nextTick()

  if (token !== loadToken) return
  const canvases = createCanvasPair(image)

  if (!canvases) {
    imageError.value = 'Failed to initialize the sprite editor canvas.'
    return
  }

  drawImageToBackingCanvas(canvases, image)
  drawBackingToVisibleCanvas(canvases)
  editCanvas.value = canvases.backingCanvas
  naturalWidth.value = canvases.backingCanvas.width
  naturalHeight.value = canvases.backingCanvas.height
  zoomScale.value = 16
  canvasReady.value = true
}

function createCanvasPair(image: HTMLImageElement): CanvasPair | null {
  const backingCanvas = document.createElement('canvas')
  const visibleCanvas = displayCanvas.value
  const backingContext = backingCanvas.getContext('2d')
  const visibleContext = visibleCanvas?.getContext('2d')

  if (!visibleCanvas || !backingContext || !visibleContext) return null
  backingCanvas.width = image.naturalWidth
  backingCanvas.height = image.naturalHeight
  visibleCanvas.width = image.naturalWidth
  visibleCanvas.height = image.naturalHeight

  return { backingCanvas, backingContext, visibleCanvas, visibleContext }
}

function drawImageToBackingCanvas(canvases: CanvasPair, image: HTMLImageElement) {
  const { backingCanvas, backingContext } = canvases
  backingContext.imageSmoothingEnabled = false
  backingContext.clearRect(0, 0, backingCanvas.width, backingCanvas.height)
  backingContext.drawImage(image, 0, 0)
}

function drawBackingToVisibleCanvas(canvases: VisibleCanvasPair) {
  const { backingCanvas, visibleCanvas, visibleContext } = canvases
  visibleContext.imageSmoothingEnabled = false
  visibleContext.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height)
  visibleContext.drawImage(backingCanvas, 0, 0)
}

function copyBackingToVisible() {
  const backingCanvas = editCanvas.value
  const visibleCanvas = displayCanvas.value
  const visibleContext = visibleCanvas?.getContext('2d')

  if (!backingCanvas || !visibleCanvas || !visibleContext) return

  drawBackingToVisibleCanvas({ backingCanvas, visibleCanvas, visibleContext })
}

function getCurrentImageData() {
  const backingCanvas = editCanvas.value
  const context = backingCanvas?.getContext('2d')

  if (!backingCanvas || !context) return null

  return context.getImageData(0, 0, backingCanvas.width, backingCanvas.height)
}

function pushUndoSnapshot() {
  const snapshot = getCurrentImageData()

  if (!snapshot) return
  const nextStack = [...undoStack.value, snapshot].slice(-maxHistoryEntries)
  undoStack.value = nextStack
  redoStack.value = []
}

function restoreSnapshot(snapshot: ImageData) {
  const backingCanvas = editCanvas.value
  const context = backingCanvas?.getContext('2d')

  if (!backingCanvas || !context) return
  context.putImageData(snapshot, 0, 0)
  copyBackingToVisible()
}

function undoEdit() {
  const snapshot = undoStack.value.at(-1)
  const current = getCurrentImageData()

  if (!snapshot || !current) return
  undoStack.value = undoStack.value.slice(0, -1)
  redoStack.value = [...redoStack.value, current].slice(-maxHistoryEntries)
  restoreSnapshot(snapshot)
  editorMessage.value = 'Undid the last edit.'
}

function redoEdit() {
  const snapshot = redoStack.value.at(-1)
  const current = getCurrentImageData()

  if (!snapshot || !current) return
  redoStack.value = redoStack.value.slice(0, -1)
  undoStack.value = [...undoStack.value, current].slice(-maxHistoryEntries)
  restoreSnapshot(snapshot)
  editorMessage.value = 'Redid the last edit.'
}

function getCanvasPoint(event: PointerEvent) {
  const canvas = displayCanvas.value

  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)
  const point = { x, y }

  if (!isPointInCanvas(point, canvas)) return null

  return point
}

function isPointInCanvas(point: CanvasPoint, canvas: HTMLCanvasElement) {
  return point.x >= 0 && point.y >= 0 && point.x < canvas.width && point.y < canvas.height
}

function applyToolAt(point: CanvasPoint) {
  const backingCanvas = editCanvas.value
  const context = backingCanvas?.getContext('2d')

  if (!backingCanvas || !context) return
  const toolActions = {
    pencil: paintPoint,
    eraser: erasePoint,
    eyedropper: samplePoint,
  }
  toolActions[activeTool.value](context, point)
}

function getBrushRect(point: CanvasPoint) {
  const offset = Math.floor(brushSize.value / 2)
  return { x: point.x - offset, y: point.y - offset, size: brushSize.value }
}

function paintPoint(context: CanvasRenderingContext2D, point: CanvasPoint) {
  const rect = getBrushRect(point)
  context.fillStyle = selectedColor.value
  context.fillRect(rect.x, rect.y, rect.size, rect.size)
  copyBackingToVisible()
}

function erasePoint(context: CanvasRenderingContext2D, point: CanvasPoint) {
  const rect = getBrushRect(point)
  context.clearRect(rect.x, rect.y, rect.size, rect.size)
  copyBackingToVisible()
}

function samplePoint(context: CanvasRenderingContext2D, point: CanvasPoint) {
  const pixel = context.getImageData(point.x, point.y, 1, 1).data
  const [red = 0, green = 0, blue = 0, alpha = 0] = pixel
  selectedColor.value = rgbToHex(red, green, blue)
  editorMessage.value = alpha === 0 ? 'Sampled a transparent pixel.' : `Sampled ${selectedColor.value}.`
}

function onPointerDown(event: PointerEvent) {
  if (!canvasReady.value) return
  event.preventDefault()
  displayCanvas.value?.setPointerCapture(event.pointerId)
  const point = getCanvasPoint(event)

  if (!point) return
  if (activeTool.value !== 'eyedropper') pushUndoSnapshot()
  applyToolAt(point)
  isDrawing.value = activeTool.value !== 'eyedropper'
}

function onPointerMove(event: PointerEvent) {
  if (!isDrawing.value || !canvasReady.value) return
  event.preventDefault()
  const point = getCanvasPoint(event)

  if (point) applyToolAt(point)
}

function onPointerUp(event: PointerEvent) {
  isDrawing.value = false
  if (displayCanvas.value?.hasPointerCapture(event.pointerId)) {
    displayCanvas.value.releasePointerCapture(event.pointerId)
  }
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map(value => value.toString(16).padStart(2, '0')).join('')}`
}

function toolButtonClass(tool: EditorTool) {
  return [
    'rounded-xl border px-3 py-2 text-sm font-semibold transition',
    activeTool.value === tool
      ? 'border-cyan-400 bg-cyan-950 text-cyan-100'
      : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white',
  ]
}

function brushButtonClass(size: 1 | 2 | 4) {
  return [
    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition',
    brushSize.value === size
      ? 'border-cyan-400 bg-cyan-950 text-cyan-100'
      : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white',
  ]
}

function historyButtonClass(enabled: boolean) {
  return [
    'rounded-xl border px-3 py-2 text-sm font-semibold transition',
    enabled
      ? 'border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500 hover:text-white'
      : 'cursor-not-allowed border-slate-800 bg-slate-950/60 text-slate-600',
  ]
}

const zoomButtonClass = 'rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white'

function zoomScaleButtonClass(scale: number) {
  return [
    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition',
    previewScale.value === scale
      ? 'border-cyan-400 bg-cyan-950 text-cyan-100'
      : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white',
  ]
}

function zoomIn() {
  const currentIndex = zoomScales.findIndex(scale => scale === zoomScale.value)
  const nextIndex = Math.min(zoomScales.length - 1, currentIndex + 1)
  zoomScale.value = zoomScales[nextIndex] ?? zoomScale.value
}

function zoomOut() {
  const currentIndex = zoomScales.findIndex(scale => scale === zoomScale.value)
  const nextIndex = Math.max(0, currentIndex - 1)
  zoomScale.value = zoomScales[nextIndex] ?? zoomScale.value
}

function isEditableElement(target: EventTarget | null): target is EditableElement {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}

function onEditorKeydown(event: KeyboardEvent) {
  if (isEditableElement(event.target)) return
  if (handleHistoryShortcut(event)) return
  handleToolShortcut(event)
}

function handleHistoryShortcut(event: KeyboardEvent) {
  const action = historyShortcutActions[getHistoryShortcutKey(event)]

  if (action) {
    event.preventDefault()
    action()
    return true
  }

  return false
}

function getHistoryShortcutKey(event: KeyboardEvent) {
  if (!event.ctrlKey && !event.metaKey) return ''

  return `${event.shiftKey ? 'shift+' : ''}${event.key.toLowerCase()}`
}

function handleToolShortcut(event: KeyboardEvent) {
  const key = event.ctrlKey || event.metaKey ? '' : event.key.toLowerCase()
  const shortcutActions: Record<string, () => void> = {
    p: () => { activeTool.value = 'pencil' },
    e: () => { activeTool.value = 'eraser' },
    i: () => { activeTool.value = 'eyedropper' },
    g: () => { showGrid.value = !showGrid.value },
    '+': zoomIn,
    '=': zoomIn,
    '-': zoomOut,
  }

  shortcutActions[key]?.()
}

function downloadEditedPng() {
  const backingCanvas = editCanvas.value

  if (!backingCanvas) return
  backingCanvas.toBlob((blob) => {
    if (!blob) {
      imageError.value = 'Failed to export the edited PNG.'
      return
    }

    const link = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    link.href = objectUrl
    link.download = `sprite-forge-edited-${sourceId.value}.png`
    link.click()
    URL.revokeObjectURL(objectUrl)
  }, 'image/png')
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to export the edited PNG.'))
    }, 'image/png')
  })
}

async function saveEditedSprite() {
  const backingCanvas = editCanvas.value
  const saveSource = getSaveSource()

  if (!backingCanvas || !saveSource) return
  isSavingEdit.value = true
  imageError.value = ''
  editorMessage.value = ''
  savedEditId.value = ''

  try {
    const blob = await canvasToPngBlob(backingCanvas)
    const form = new FormData()
    form.append('sourceType', saveSource.sourceType)
    form.append('sourceId', saveSource.sourceId)
    form.append('file', blob, `sprite-forge-edited-${saveSource.sourceId}.png`)

    const response = await $fetch<{ edit: SpriteEdit }>('/api/sprite-edits', {
      method: 'POST',
      body: form,
    })

    savedEditId.value = response.edit.id
    editorMessage.value = `Saved edited sprite (${response.edit.width}x${response.edit.height}).`
  }
  catch (error) {
    imageError.value = getSaveErrorMessage(error)
  }
  finally {
    isSavingEdit.value = false
  }
}

function getSaveSource(): SaveSource | null {
  const currentSourceKind = sourceKind.value
  const currentSourceId = sourceId.value

  return currentSourceKind && currentSourceId !== 'None'
    ? { sourceType: currentSourceKind, sourceId: currentSourceId }
    : null
}

function getSaveErrorMessage(error: unknown) {
  const statusMessage = (error as { statusMessage?: unknown } | null)?.statusMessage

  return typeof statusMessage === 'string'
    ? statusMessage
    : error instanceof Error ? error.message : 'Failed to save the edited sprite.'
}

async function onUpload(upload: UploadRecord) {
  await router.replace({ path: '/editor', query: { uploadId: upload.id } })
}

onMounted(() => {
  window.addEventListener('keydown', onEditorKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEditorKeydown)
})

watch(imageUrl, url => loadImageToCanvas(url), { immediate: true })
</script>

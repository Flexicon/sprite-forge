<template>
  <AppShell title="Sprite Editor">
    <div class="space-y-6">
      <section class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
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
            <button
              v-if="canvasReady"
              type="button"
              class="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              @click="downloadEditedPng"
            >
              Download edited PNG
            </button>
          </div>

          <div class="mt-6 flex min-h-[24rem] items-center justify-center overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div v-if="imageUrl" class="max-w-full">
              <canvas
                ref="displayCanvas"
                class="rounded-lg border border-slate-700 bg-transparent [image-rendering:pixelated]"
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
              <p v-if="canvasReady" class="mt-3 text-center text-xs text-slate-500">
                Editing {{ imageDimensions }} at {{ previewScale }}x preview scale.
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
            <h2 class="text-lg font-bold text-slate-100">Tools</h2>
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

            <p class="mt-5 text-xs leading-5 text-slate-500">
              Pencil paints with the selected color. Eraser clears pixels to transparent. Eyedropper samples the clicked pixel color.
            </p>
          </section>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import type { UploadRecord } from '~/types'

type EditorTool = 'pencil' | 'eraser' | 'eyedropper'
type CanvasPoint = { x: number, y: number }
type CanvasPair = {
  backingCanvas: HTMLCanvasElement
  backingContext: CanvasRenderingContext2D
  visibleCanvas: HTMLCanvasElement
  visibleContext: CanvasRenderingContext2D
}
type VisibleCanvasPair = Pick<CanvasPair, 'backingCanvas' | 'visibleCanvas' | 'visibleContext'>

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
const selectedColor = ref('#38bdf8')
const activeTool = ref<EditorTool>('pencil')
const brushSize = ref<1 | 2 | 4>(1)

const tools: { id: EditorTool, label: string }[] = [
  { id: 'pencil', label: 'Pencil' },
  { id: 'eraser', label: 'Eraser' },
  { id: 'eyedropper', label: 'Pick' },
]
const brushSizes = [1, 2, 4] as const
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
const previewScale = computed(() => {
  const longestSide = Math.max(Number(naturalWidth.value), Number(naturalHeight.value), 1)
  const powerOfTwoSide = 2 ** Math.ceil(Math.log2(Math.max(longestSide, 32)))

  return Math.max(2, Math.min(16, 512 / powerOfTwoSide))
})
const canvasStyle = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return {}

  return {
    width: `${naturalWidth.value * previewScale.value}px`,
    height: `${naturalHeight.value * previewScale.value}px`,
    touchAction: 'none',
  }
})

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
  displayCanvas.value?.releasePointerCapture(event.pointerId)
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

async function onUpload(upload: UploadRecord) {
  await router.replace({ path: '/editor', query: { uploadId: upload.id } })
}

watch(imageUrl, url => loadImageToCanvas(url), { immediate: true })
</script>

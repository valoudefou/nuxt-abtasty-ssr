<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-50">
    <transition name="slide-up">
      <section
        v-if="isOpen"
        class="pointer-events-auto w-full border-t border-emerald-500/30 bg-slate-950/95 px-6 pt-5 pb-3 shadow-[0_-18px_60px_-35px_rgba(16,185,129,0.8)] backdrop-blur"
        :style="{ height: `${panelHeight}px` }"
      >
        <!-- Updated: More prominent integrated resize handle with decreased shadow -->
        <div
          class="absolute inset-x-0 top-0 h-9 -translate-y-full cursor-ns-resize flex items-center justify-center gap-3
                 bg-emerald-600/30 hover:bg-emerald-600/40 transition-colors duration-150"
          :class="{ 'bg-emerald-600/50': isResizing }"
          @mousedown.prevent="startResize"
          @touchstart.prevent="startResize"
        >
          <svg
            class="h-6 w-6 text-emerald-100 animate-pulse-slow"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 11l5-5m0 0l5 5m-5-5v12"
            ></path>
          </svg>
          <span class="text-sm font-bold uppercase tracking-widest text-emerald-100">Drag to Resize</span>
        </div>

        <div class="mx-auto flex h-full max-w-6xl flex-col gap-3">
          <header class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-emerald-200/80">
              <span class="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400/90"></span>
              <span class="tracking-wider text-[13px]">AB Tasty Logs</span>
            </div>
            <div class="flex flex-1 items-center justify-between gap-3 text-[11px] text-emerald-300/70">
              <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-[2px] font-semibold">
                {{ filteredCountLabel }}
              </span>
              <label class="relative inline-flex items-center">
                <span class="sr-only">Search logs</span>
                <svg
                  class="pointer-events-none absolute left-3 h-4 w-4 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <!-- MODIFIED: Search input with reduced letter spacing and no extra border/ring on focus -->
                <input
                  v-model="searchTerm"
                  type="search"
                  placeholder="Search logs..."
                  class="w-56 rounded-full border border-emerald-400 bg-slate-800/80 px-10 py-2 text-sm tracking-wide text-emerald-100 placeholder:text-emerald-300/70 focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-300/40 sm:w-80"
                />
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-full border border-emerald-500/30 bg-transparent px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
                  @click="zoomOut"
                >
                  A-
                </button>
                <button
                  type="button"
                  class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
                  @click="resetZoom"
                >
                  {{ zoomLabel }}
                </button>
                <button
                  type="button"
                  class="rounded-full border border-emerald-500/30 bg-transparent px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
                  @click="zoomIn"
                >
                  A+
                </button>
              </div>
              <button
                type="button"
                class="rounded-full border border-emerald-500/30 bg-transparent px-3 py-1.5 text-sm font-medium uppercase tracking-[0.2em] text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
                @click="isOpen = false"
              >
                LOGS - PRESS L
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-hidden rounded-xl border border-emerald-500/15 bg-black/40 shadow-inner">
            <div
              class="log-content h-full overflow-y-auto p-3 text-emerald-200"
              :style="{ '--log-font-size': `${baseFontSize * zoomLevel}px` }"
            >
              <div
                v-if="filteredLogs.length === 0"
                class="flex h-full items-center justify-center rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 py-6 text-sm text-emerald-300/70"
              >
                <span v-if="searchTerm">No Flagship log entries match your search.</span>
                <span v-else>Waiting for flag activity…</span>
              </div>
              <div v-else class="space-y-3">
                <article
                  v-for="(log, index) in filteredLogs"
                  :key="`${log.timestamp}-${index}`"
                  class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 shadow-sm shadow-emerald-900/20 transition hover:border-emerald-400/50"
                >
                  <div class="log-entry-meta flex flex-wrap items-center gap-2 font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
                    <span>{{ formatTimestamp(log.timestamp) }}</span>
                    <span class="text-emerald-500/40">•</span>
                    <span
                      :class="levelTone(log.level)"
                      class="rounded-full border border-current bg-transparent px-2 py-[2px] font-bold"
                    >
                      {{ log.level }}
                    </span>
                    <span v-if="log.tag" class="rounded-full border border-emerald-500/20 px-2 py-[2px] font-medium text-emerald-200/80">
                      {{ log.tag }}
                    </span>
                  </div>
                  <pre class="log-entry-message mt-2 whitespace-pre-wrap break-words font-mono text-emerald-200/90">
{{ stringify(log.message) }}
                  </pre>
                  <div v-if="supplementalKeys(log).length" class="log-entry-extra mt-3 space-y-1 text-emerald-300/70">
                    <div v-for="key in supplementalKeys(log)" :key="key">
                      <span class="font-semibold text-emerald-200">{{ key }}:</span>
                      <span class="ml-1 font-mono text-emerald-300/90">{{ stringify(log[key]) }}</span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </transition>

    <transition name="fade">
      <div v-if="!isOpen" class="pointer-events-auto flex justify-end px-6 pb-4">
        <button
          type="button"
          class="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-950/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300 shadow-[0_18px_40px_-32px_rgba(16,185,129,0.95)] transition hover:border-emerald-400 hover:text-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
          @click="isOpen = true"
        >
          <span class="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400/90"></span>
          <span class="tracking-widest text-[13px]">Logs - PRESS L</span>
          <span class="rounded-full bg-emerald-500/15 px-2 py-[2px] text-[10px] font-bold text-emerald-200">{{ logs.length }}</span>
        </button>
      </div>
    </transition>

    <div
      v-if="isOpen && isResizing"
      class="resize-ghost-outline pointer-events-none fixed inset-x-0 bottom-0 z-40"
      :style="{ height: `${ghostHeight}px` }"
    >
    </div>
  </div>
</template>

<script setup lang="ts">
import { flagshipLogStore, type FlagshipLogEntry } from '@/utils/flagship/logStore'

const logs = ref<FlagshipLogEntry[]>([])
const isOpen = useState('flagship-log-viewer-open', () => false)
const searchTerm = useState('flagship-log-search', () => '')
const panelHeight = useState('flagship-log-panel-height', () => 320)
const isResizing = ref(false)
const ghostHeight = ref(panelHeight.value)
const zoomLevel = useState('flagship-log-zoom', () => 1)

const MIN_HEIGHT = 200
const MAX_HEIGHT_FALLBACK = 900
const MAX_HEIGHT_PADDING = 120
const maxHeight = ref(MAX_HEIGHT_FALLBACK)
const updateMaxHeight = () => {
  if (typeof window === 'undefined') return
  maxHeight.value = Math.max(MIN_HEIGHT, window.innerHeight - MAX_HEIGHT_PADDING)
}
let resizeStartY = 0
let resizeStartHeight = panelHeight.value
const STORAGE_KEY = 'flagship-log-panel-open'
const ZOOM_STORAGE_KEY = 'flagship-log-panel-zoom'
const MIN_ZOOM = 0.8
const MAX_ZOOM = 2.2
const ZOOM_STEP = 0.1
const baseFontSize = 12
let unsubscribeLogs: (() => void) | null = null

const clampHeight = (value: number) => Math.min(maxHeight.value, Math.max(MIN_HEIGHT, value))
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))

const updateHeight = (clientY: number) => {
  const newHeight = clampHeight(resizeStartHeight + (resizeStartY - clientY))
  panelHeight.value = newHeight
  ghostHeight.value = newHeight
}

const handleMouseMove = (event: MouseEvent) => {
  updateHeight(event.clientY)
}

const handleTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 0) return
  event.preventDefault()
  updateHeight(event.touches[0].clientY)
}

const stopResize = () => {
  if (!isResizing.value || typeof window === 'undefined') return
  isResizing.value = false
  if (typeof document !== 'undefined') {
    document.body.style.userSelect = ''
  }
  ghostHeight.value = panelHeight.value
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('mouseup', stopResize)
  window.removeEventListener('touchend', stopResize)
  window.removeEventListener('touchcancel', stopResize)
}

const startResize = (event: MouseEvent | TouchEvent) => {
  if (typeof window === 'undefined') return
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY

  resizeStartY = clientY
  resizeStartHeight = panelHeight.value
  isResizing.value = true
  ghostHeight.value = panelHeight.value;

  if (typeof document !== 'undefined') {
    document.body.style.userSelect = 'none'
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('mouseup', stopResize)
  window.addEventListener('touchend', stopResize)
  window.addEventListener('touchcancel', stopResize)
}

const zoomIn = () => {
  zoomLevel.value = clampZoom(Number((zoomLevel.value + ZOOM_STEP).toFixed(2)))
}

const zoomOut = () => {
  zoomLevel.value = clampZoom(Number((zoomLevel.value - ZOOM_STEP).toFixed(2)))
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const zoomLabel = computed(() => `${Math.round(zoomLevel.value * 100)}%`)

const handleKeyboardToggle = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return
  }

  const target = event.target as HTMLElement | null
  const tag = target?.tagName?.toLowerCase()
  if (tag && (tag === 'input' || tag === 'textarea' || target?.isContentEditable)) {
    return
  }

  const key = event.key.toLowerCase()
  if (key === 'l') {
    isOpen.value = !isOpen.value
    return
  }

  if (!isOpen.value) {
    return
  }

  if (key === '=' || key === '+') {
    zoomIn()
  } else if (key === '-') {
    zoomOut()
  } else if (key === '0') {
    resetZoom()
  }
}

const stringify = (value: unknown) => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const supplementalKeys = (log: FlagshipLogEntry) =>
  Object.keys(log).filter((key) => !['timestamp', 'level', 'message', 'tag'].includes(key))

const filteredLogs = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) {
    return logs.value
  }

  return logs.value.filter((entry) => {
    const baseSegments = [
      entry.timestamp,
      entry.level,
      entry.tag,
      stringify(entry.message)
    ]

    const extraSegments = supplementalKeys(entry).map((key) => `${key}: ${stringify(entry[key])}`)

    return [...baseSegments, ...extraSegments].some((segment) =>
      stringify(segment).toLowerCase().includes(query)
    )
  })
})

const filteredCountLabel = computed(() => {
  if (!searchTerm.value.trim()) {
    return String(logs.value.length)
  }

  return `${filteredLogs.value.length}/${logs.value.length}`
})

const levelTone = (level: FlagshipLogEntry['level']) => {
  switch (level) {
    case 'ERROR':
    case 'CRITICAL':
    case 'EMERGENCY':
      return 'text-rose-300'
    case 'WARNING':
      return 'text-amber-300'
    case 'INFO':
    case 'NOTICE':
      return 'text-emerald-300'
    case 'DEBUG':
    default:
      return 'text-slate-300'
  }
}

const formatTimestamp = (value: string) => {
  const parsed = Number.isNaN(Date.parse(value)) ? value : new Date(value)

  if (parsed instanceof Date) {
    const formatted = parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    return `[${formatted}]`
  }

  if (typeof parsed === 'string' && !parsed.startsWith('[')) {
    return `[${parsed}]`
  }

  return value
}

watch(isOpen, (open) => {
  if (!open) {
    stopResize()
  }

  if (import.meta.client) {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? 'true' : 'false')
    } catch {
      // ignore storage errors
    }
  }
})

watch(zoomLevel, (value) => {
  if (import.meta.client) {
    try {
      window.localStorage.setItem(ZOOM_STORAGE_KEY, String(value))
    } catch {
      // ignore storage errors
    }
  }
})

onMounted(() => {
  if (import.meta.client) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        isOpen.value = stored === 'true'
      }
      const storedZoom = window.localStorage.getItem(ZOOM_STORAGE_KEY)
      if (storedZoom) {
        const parsed = Number.parseFloat(storedZoom)
        if (Number.isFinite(parsed)) {
          zoomLevel.value = clampZoom(parsed)
        }
      }
    } catch {
      // ignore storage read errors
    }
  }

  if (typeof window !== 'undefined') {
    updateMaxHeight()
    window.addEventListener('resize', updateMaxHeight)
  }

  unsubscribeLogs = flagshipLogStore.subscribe((entries) => {
    logs.value = entries
  })

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyboardToggle)
  }
})

onBeforeUnmount(() => {
  unsubscribeLogs?.()
  unsubscribeLogs = null
  stopResize()

  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMaxHeight)
    window.removeEventListener('keydown', handleKeyboardToggle)
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.resize-ghost-outline {
  border-top: 3px dashed rgba(52, 211, 153, 0.8); /* Stronger emerald border */
  border-left: 3px dashed rgba(52, 211, 153, 0.8);
  border-right: 3px dashed rgba(52, 211, 153, 0.8);
  background-color: rgba(16, 185, 129, 0.05); /* Slightly opaque fill */
  box-shadow: 0 -10px 60px -10px rgba(16, 185, 129, 0.8); /* Stronger shadow */
  pointer-events: none; /* Ensure it doesn't block interactions */
}

/* Custom slow pulse for the SVG icon */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.log-content {
  font-size: var(--log-font-size, 12px);
  line-height: 1.6;
}

.log-entry-meta {
  font-size: calc(var(--log-font-size, 12px) * 0.85);
}

.log-entry-message {
  font-size: var(--log-font-size, 12px);
  line-height: 1.6;
}

.log-entry-extra {
  font-size: calc(var(--log-font-size, 12px) * 0.85);
}
</style>

<template>
  <div class="fixed inset-x-0 top-0 z-50 flex justify-center px-4 py-3 pointer-events-none">
    <transition name="fade">
      <div
        v-if="isOpen"
        class="pointer-events-auto w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-xl shadow-slate-950/60 backdrop-blur"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Flagship Logs</h2>
          <button
            type="button"
            class="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            @click="isOpen = false"
          >
            Close
          </button>
        </div>
        <div class="mt-3 max-h-60 overflow-y-auto pr-1 text-xs text-slate-200">
          <div
            v-if="logs.length === 0"
            class="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-4 text-center text-slate-500"
          >
            No Flagship log entries yet.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(log, index) in logs"
              :key="`${log.timestamp}-${index}`"
              class="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
            >
              <div class="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>{{ log.timestamp }}</span>
                <span>•</span>
                <span :class="levelColor(log.level)">{{ log.level }}</span>
                <span v-if="log.tag">• {{ log.tag }}</span>
              </div>
              <div class="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-200">
                {{ stringify(log.message) }}
              </div>
              <div v-if="supplementalKeys(log).length" class="mt-2 space-y-1 text-[11px] text-slate-400">
                <div v-for="key in supplementalKeys(log)" :key="key">
                  <span class="font-semibold text-slate-300">{{ key }}:</span>
                  <span class="ml-1 font-mono text-[11px] text-slate-300">{{ stringify(log[key]) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <button
        v-if="!isOpen"
        type="button"
        class="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/95 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 shadow-lg shadow-slate-950/60 transition hover:border-slate-600 hover:text-white"
        @click="isOpen = true"
      >
        <span>Flagship Logs</span>
        <span class="ml-1 rounded-full bg-slate-800 px-2 py-[1px] text-[10px] font-bold text-slate-200">{{ logs.length }}</span>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { flagshipLogStore, type FlagshipLogEntry } from '@/utils/flagship/logStore'

const logs = ref<FlagshipLogEntry[]>([])
const isOpen = useState('flagship-log-viewer-open', () => true)

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

const levelColor = (level: FlagshipLogEntry['level']) => {
  switch (level) {
    case 'ERROR':
    case 'CRITICAL':
    case 'EMERGENCY':
      return 'text-rose-400'
    case 'WARNING':
      return 'text-amber-400'
    case 'INFO':
    case 'NOTICE':
      return 'text-emerald-400'
    case 'DEBUG':
    default:
      return 'text-slate-400'
  }
}

onMounted(() => {
  const unsubscribe = flagshipLogStore.subscribe((entries) => {
    logs.value = entries
  })

  onBeforeUnmount(() => {
    unsubscribe()
  })
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

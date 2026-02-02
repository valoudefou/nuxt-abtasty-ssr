<template>
  <div class="mt-10 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-slate-900">Order {{ orderId }}</h1>
      <button
        type="button"
        class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
        :disabled="pending"
        @click="() => refresh()"
      >
        Refresh
      </button>
    </div>

    <p v-if="orderErrorMessage" class="text-sm text-red-600">{{ orderErrorMessage }}</p>

    <div v-else-if="pending" class="text-sm text-slate-600">Loading order…</div>

    <div v-else-if="order" class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Current status</p>
        <p class="mt-2 text-lg font-semibold text-slate-900">{{ order.status }}</p>
        <p v-if="latestForOrder" class="mt-2 text-xs text-slate-500">
          Live update: {{ latestForOrder.status }} ({{ formatTimestamp(latestForOrder.receivedAt) }})
        </p>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Update status</p>
            <p class="mt-1 text-sm text-slate-600">Sends a POST to the orders service.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <select
              v-model="selectedStatus"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option v-for="status in orderStatuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
            <button
              type="button"
              class="rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-60"
              :disabled="updating"
              @click="submitStatus"
            >
              {{ updating ? 'Updating…' : 'Update' }}
            </button>
          </div>
        </div>
        <p v-if="updateErrorMessage" class="mt-3 text-sm text-red-600">{{ updateErrorMessage }}</p>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Status history</p>
        <ul v-if="normalizedHistory.length" class="mt-4 space-y-2 text-sm text-slate-700">
          <li v-for="(entry, index) in normalizedHistory" :key="`${entry.status}:${entry.timestamp ?? index}`">
            <span class="font-semibold text-slate-900">{{ entry.status }}</span>
            <span v-if="entry.timestamp" class="text-slate-500">
              — {{ formatTimestamp(entry.timestamp) }}
            </span>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-slate-600">No status history available.</p>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Live updates (WebSocket)</p>
        <ul v-if="liveEvents.length" class="mt-4 space-y-2 text-sm text-slate-700">
          <li v-for="(event, index) in liveEvents" :key="`${event.status}:${event.receivedAt}:${index}`">
            <span class="font-semibold text-slate-900">{{ event.status }}</span>
            <span class="text-slate-500">— {{ formatTimestamp(event.receivedAt) }}</span>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-slate-600">Waiting for live updates…</p>
      </section>

      <details class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <summary class="cursor-pointer text-sm font-semibold text-slate-900">Raw order payload</summary>
        <pre class="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{{ JSON.stringify(order, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { orderStatuses, type OrderStatus, type OrderStatusHistoryItem, type OrderStatusSocketMessage } from '@/types/order'

type LiveEvent = OrderStatusSocketMessage & { receivedAt: string }

const route = useRoute()
const orderId = computed(() => String(route.params.orderId ?? ''))

const { data: order, pending, error, refresh } = useOrder(orderId)

const orderErrorMessage = computed(() => {
  if (!error.value) return null
  const status = (error.value as { statusCode?: number; status?: number })?.statusCode
    ?? (error.value as { status?: number })?.status
  return status ? `Failed to load order (HTTP ${status}).` : 'Failed to load order.'
})

const selectedStatus = ref<OrderStatus>('PACKED')
const {
  execute: updateStatus,
  pending: updating,
  error: updateError
} = useUpdateOrderStatus(orderId, selectedStatus)

const updateErrorMessage = computed(() => {
  if (!updateError.value) return null
  const status = (updateError.value as { statusCode?: number; status?: number })?.statusCode
    ?? (updateError.value as { status?: number })?.status
  return status ? `Failed to update status (HTTP ${status}).` : 'Failed to update status.'
})

const submitStatus = async () => {
  await updateStatus()
  if (updateError.value) return
  await refresh()
}

const socket = useOrderStatusSocket()
const liveEvents = ref<LiveEvent[]>([])
const latestForOrder = ref<LiveEvent | null>(null)

onMounted(() => {
  const unsubscribe = socket.subscribe((message) => {
    if (message.orderId !== orderId.value) return
    const receivedAt = new Date().toISOString()
    latestForOrder.value = { ...message, receivedAt }
    liveEvents.value = [{ ...message, receivedAt }, ...liveEvents.value].slice(0, 25)

    if (order.value) {
      order.value.status = message.status
      const existing = Array.isArray(order.value.statusHistory) ? order.value.statusHistory : []
      order.value.statusHistory = [...existing, { status: message.status, timestamp: receivedAt }]
    }
  })

  onBeforeUnmount(() => {
    unsubscribe()
  })
})

const normalizedHistory = computed<OrderStatusHistoryItem[]>(() => {
  const history = order.value?.statusHistory
  if (Array.isArray(history) && history.length > 0) return history
  if (order.value?.status) return [{ status: order.value.status }]
  return []
})

const formatTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

useHead(() => ({ title: `Order ${orderId.value} – Commerce Demo` }))
</script>

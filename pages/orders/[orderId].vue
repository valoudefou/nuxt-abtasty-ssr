<template>
  <div class="mx-auto mt-10 max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8">
    <header class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Order confirmation</p>
      <h1 class="text-2xl font-semibold text-slate-900">Order {{ orderId }}</h1>
    </header>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="missingConfig" class="space-y-2">
        <p class="text-sm font-semibold text-red-700">Configuration error</p>
        <p class="text-sm text-slate-700">
          <code class="rounded bg-slate-100 px-1 py-0.5">runtimeConfig.public.apiBase</code> is not set.
        </p>
      </div>

      <div v-else-if="pending" class="text-sm text-slate-600">Loading…</div>

      <div v-else-if="errorMessage" class="space-y-3">
        <p class="text-sm font-semibold text-red-700">We couldn’t load this order.</p>
        <p class="text-sm text-slate-700">{{ errorMessage }}</p>
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
          @click="() => refresh()"
        >
          Try again
        </button>
      </div>

      <div v-else-if="order" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Status</p>
            <p class="mt-2 text-lg font-semibold text-slate-900">{{ order.status }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Total</p>
            <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatTotal(order.total) }}</p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Customer</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">
              {{ customerName ?? '—' }}
            </p>
            <p v-if="customerEmail" class="mt-1 text-sm text-slate-700">{{ customerEmail }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Last updated</p>
            <p class="mt-2 text-sm text-slate-700">{{ formatTimestamp(order.updatedAt) }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-sm text-slate-600">No order found.</div>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const orderId = computed(() => {
  const value = route.params.orderId
  if (Array.isArray(value)) return String(value[0] ?? '')
  return String(value ?? '')
})

type OrderResponse = {
  id: string | number
  publicId: string
  status: string
  updatedAt: string
  total: number | string | { amount: number; currency?: string }
  customer?: {
    firstName?: string
    lastName?: string
    name?: string
    email?: string
  } | null
  items?: Array<unknown>
  statusHistory?: Array<unknown>
}

const { public: publicConfig } = useRuntimeConfig()
const apiBase = computed(() => (publicConfig?.apiBase ? String(publicConfig.apiBase) : ''))
const missingConfig = computed(() => !apiBase.value)

const orderUrl = computed(() => `/orders/${encodeURIComponent(orderId.value)}`)
const canFetch = computed(() => Boolean(orderId.value && apiBase.value))

const {
  data: order,
  pending,
  error,
  refresh
} = await useFetch<OrderResponse>(orderUrl, {
  baseURL: apiBase,
  key: `order:${orderId.value}`,
  immediate: false,
  watch: false
})

if (canFetch.value) {
  await refresh()
}

watch([canFetch, orderId, apiBase], async ([enabled], [_prevEnabled, prevOrderId, prevApiBase]) => {
  if (!enabled) {
    order.value = null
    return
  }

  if (orderId.value !== prevOrderId || apiBase.value !== prevApiBase) {
    order.value = null
  }

  await refresh()
})

const errorMessage = computed(() => {
  if (!error.value) return null
  const status = (error.value as { statusCode?: number; status?: number })?.statusCode
    ?? (error.value as { status?: number })?.status
  return status ? `Request failed (HTTP ${status}).` : 'Request failed.'
})

const customerName = computed(() => {
  const customer = order.value?.customer
  if (!customer) return null
  const fromParts = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim()
  if (fromParts) return fromParts
  return customer.name?.trim() || null
})

const customerEmail = computed(() => order.value?.customer?.email?.trim() || null)

const formatTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const formatTotal = (value: OrderResponse['total']) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  }
  const amount = typeof value.amount === 'number' ? value.amount : null
  if (amount === null) return '—'
  const currency = value.currency
  if (currency) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
    } catch {
      // noop
    }
  }
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

useHead(() => ({
  title: orderId.value ? `Order ${orderId.value} – Commerce Demo` : 'Order confirmation – Commerce Demo'
}))
</script>

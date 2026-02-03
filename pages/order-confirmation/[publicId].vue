<template>
  <div v-if="displayOrder" class="mt-10 space-y-10">
    <section class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-slate-900 p-10 text-white shadow-2xl">
      <div class="flex flex-wrap items-start justify-between gap-8">
        <div class="max-w-2xl space-y-3">
          <p class="text-sm uppercase tracking-[0.3em] text-white/70">Order confirmed</p>
          <h1 class="text-4xl font-semibold">Thanks for your purchase!</h1>
          <p class="text-sm text-white/80">
            A detailed receipt has been sent to your inbox. We&apos;ll let you know as soon as your order ships.
          </p>
        </div>
        <div class="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur">
          <p class="text-xs uppercase tracking-[0.3em] text-white/70">Order ID</p>
          <p class="mt-2 text-2xl font-semibold">{{ displayOrder.publicId }}</p>
          <p v-if="displayOrder.status" class="mt-1 text-xs text-white/80">
            Status: {{ formatStatus(displayOrder.status) }}
          </p>
          <p v-else class="mt-1 text-xs text-white/80">Placed just now</p>
        </div>
      </div>
      <div class="mt-8 flex flex-wrap gap-4 text-sm text-white/80">
        <div class="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 backdrop-blur">
          <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
          Preparing your items
        </div>
        <div
          v-if="displayOrder.updatedAt"
          class="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 backdrop-blur"
        >
          Updated {{ formatTimestamp(displayOrder.updatedAt) }}
        </div>
      </div>
    </section>

    <div class="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div class="space-y-8">
        <section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm uppercase tracking-[0.25em] text-primary-500">What&apos;s next</p>
              <h2 class="mt-2 text-xl font-semibold text-slate-900">Fulfilment timeline</h2>
            </div>
            <span
              v-if="displayOrder.status"
              class="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600"
            >
              {{ formatStatus(displayOrder.status) }}
            </span>
          </div>

          <div class="mt-6">
            <div class="flex items-start justify-between gap-4">
              <p class="text-sm font-medium text-slate-700">
                {{ currentStepCopy }}
              </p>
              <p v-if="displayOrder.updatedAt" class="text-xs text-slate-500">
                Updated {{ formatTimestamp(displayOrder.updatedAt) }}
              </p>
            </div>

            <div class="mt-4">
              <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-primary-600 transition-all"
                  :style="{ width: `${progressPercent}%` }"
                />
              </div>
              <div class="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Placed</span>
                <span>Delivered</span>
              </div>
            </div>

            <ol v-if="timelineSteps.length" class="mt-6 space-y-4">
              <li
                v-for="(step, index) in timelineSteps"
                :key="step.key"
                class="relative flex gap-4"
              >
                <div class="relative flex w-10 flex-col items-center">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full ring-1"
                    :class="{
                      'bg-primary-600 text-white ring-primary-200 shadow-sm': step.state === 'current',
                      'bg-emerald-50 text-emerald-700 ring-emerald-200': step.state === 'complete',
                      'bg-slate-100 text-slate-400 ring-slate-200': step.state === 'upcoming'
                    }"
                  >
                    <span v-if="step.state === 'complete'" class="text-sm font-semibold">✓</span>
                    <span v-else class="text-sm font-semibold">{{ index + 1 }}</span>
                  </div>
                  <div
                    v-if="index !== timelineSteps.length - 1"
                    class="mt-1 w-px flex-1"
                    :class="step.state === 'complete' ? 'bg-emerald-200' : 'bg-slate-200'"
                  />
                </div>

                <div class="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-slate-900">
                        {{ step.title }}
                      </p>
                      <p v-if="step.description" class="mt-1 text-sm text-slate-600">
                        {{ step.description }}
                      </p>
                    </div>
                    <span
                      v-if="step.timestamp"
                      class="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                    >
                      {{ formatTimestamp(step.timestamp) }}
                    </span>
                  </div>
                </div>
              </li>
            </ol>

            <p v-else class="mt-6 text-sm text-slate-600">
              We’re processing your order. You can revisit this page anytime using your confirmation link.
            </p>
          </div>
        </section>

        <div class="grid gap-6 md:grid-cols-2">
          <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Customer</h3>
            <p class="mt-4 text-lg font-semibold text-slate-900">
              {{ displayOrder.customer?.name ?? '—' }}
            </p>
            <p v-if="displayOrder.customer?.email" class="mt-2 text-sm text-slate-600 leading-relaxed">
              {{ displayOrder.customer.email }}
            </p>
            <p v-if="displayOrder.customer?.address" class="mt-2 whitespace-pre-line text-sm text-slate-600 leading-relaxed">
              {{ displayOrder.customer.address }}
            </p>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Order info</h3>
            <div class="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Confirmation ID</p>
                <p class="mt-1 break-all text-base font-semibold text-slate-900">
                  {{ displayOrder.publicId }}
                </p>
              </div>
              <div v-if="displayOrder.updatedAt">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Last updated</p>
                <p class="mt-1 leading-relaxed">
                  {{ formatTimestamp(displayOrder.updatedAt) }}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <aside class="space-y-6">
        <section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">Order summary</h2>
              <p class="mt-1 text-sm text-slate-600">You&apos;ll receive a separate shipping email once on the way.</p>
            </div>
            <button
              type="button"
              class="text-sm font-semibold text-primary-600 hover:text-primary-500"
              @click="printReceipt"
            >
              Download receipt
            </button>
          </div>
          <ul class="mt-6 divide-y divide-slate-100">
            <li
              v-for="item in displayOrder.items"
              :key="item.id"
              class="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-4">
                <div class="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                  <img v-if="item.image" :src="item.image" :alt="item.name" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
                    {{ item.name.slice(0, 2).toUpperCase() }}
                  </div>
                </div>
                <div>
                  <p class="font-semibold text-slate-900">{{ item.name }}</p>
                  <p class="text-xs text-slate-500">{{ item.quantity }} × {{ formatCurrency(item.price) }}</p>
                </div>
              </div>
              <p class="font-semibold text-slate-900">{{ formatCurrency(item.price * item.quantity) }}</p>
            </li>
          </ul>
          <dl class="mt-6 space-y-3 text-sm text-slate-600">
            <div class="flex items-center justify-between">
              <dt>Items subtotal</dt>
              <dd class="font-semibold text-slate-900">{{ formatCurrency(itemsSubtotal) }}</dd>
            </div>
          </dl>
          <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 text-lg font-semibold text-slate-900">
            <span>Total paid</span>
            <span>{{ formatCurrency(displayOrder.total) }}</span>
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <p class="font-semibold text-slate-900">Need help?</p>
          <p class="mt-2">
            Reply to your confirmation email or reach our concierge team anytime. We&apos;re here for sizing, fit, and delivery updates.
          </p>
        </section>
      </aside>
    </div>

    <div class="flex flex-wrap gap-4">
      <NuxtLink
        :to="homePath"
        class="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
      >
        Continue shopping
      </NuxtLink>
      <NuxtLink
        :to="orderStatusPath"
        class="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/15"
      >
        View order status
      </NuxtLink>
      <button
        type="button"
        class="inline-flex items-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        @click="printReceipt"
      >
        Print receipt
      </button>
    </div>
  </div>

  <div v-else class="mx-auto mt-10 max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Order confirmation</p>
      <h1 class="text-2xl font-semibold text-slate-900">Order {{ publicId }}</h1>
      <p class="text-sm text-slate-600">
        This confirmation link is valid even if you open it in a new tab.
      </p>
    </header>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="pending" class="text-sm text-slate-600">Loading…</div>
      <div v-else-if="statusError" class="space-y-3">
        <p class="text-sm font-semibold text-red-700">We couldn’t load your order details.</p>
        <p class="text-sm text-slate-700">{{ statusError }}</p>
      </div>
      <div v-else class="space-y-2 text-sm text-slate-700">
        <p v-if="remoteOrder?.status"><span class="font-semibold">Status:</span> {{ remoteOrder.status }}</p>
        <p v-if="remoteOrder?.updatedAt"><span class="font-semibold">Updated:</span> {{ formatTimestamp(remoteOrder.updatedAt) }}</p>
        <p class="text-slate-500">
          If you just placed this order, it can take a moment for details to appear.
        </p>
      </div>
    </section>

    <div class="flex flex-wrap gap-3">
      <NuxtLink
        :to="orderStatusPath"
        class="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
      >
        View order status
      </NuxtLink>
      <NuxtLink
        :to="homePath"
        class="inline-flex items-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        Continue shopping
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
type CheckoutSummary = {
  orderId: string
  remoteOrderId?: number
  publicOrderId?: string
  items: Array<{
    id: string | number
    name: string
    quantity: number
    price: number
    image: string
    category: string
  }>
  total: number
  email: string
  shipping: {
    firstName: string
    lastName: string
    address: string
    city: string
    postcode: string
    country: string
  }
  billing: {
    address: string
    city: string
    postcode: string
    country: string
  }
  delivery: {
    id: string
    label: string
    cost: number
    description: string
  }
}

type RemoteOrder = {
  id: number
  publicId: string
  status?: string
  createdAt?: string
  updatedAt?: string
  customer?: {
    name?: string
    email?: string
    address?: string
  } | null
  items?: Array<{
    id: number | string
    quantity: number
    price: number
    product?: {
      sku?: string
      name?: string
      price?: number
    } | null
  }>
  total?: number
  statusHistory?: Array<{
    status: string
    createdAt?: string
  }>
}

type DisplayOrder = {
  publicId: string
  status?: string
  updatedAt?: string
  total: number
  customer?: {
    name?: string
    email?: string
    address?: string
  }
  items: Array<{
    id: string | number
    name: string
    quantity: number
    price: number
    image?: string
  }>
  statusHistory?: Array<{
    status: string
    createdAt?: string
  }>
}

const route = useRoute()
const publicId = computed(() => {
  const value = route.params.publicId
  if (Array.isArray(value)) return String(value[0] ?? '')
  return String(value ?? '')
})

const companyId = computed(() => {
  const value = route.params.companyId
  if (Array.isArray(value)) return String(value[0] ?? '')
  return String(value ?? '')
})

const namespacePrefix = computed(() => {
  const id = companyId.value.trim()
  if (!id) return ''
  if (route.path.startsWith('/v/companyId/')) {
    return `/v/companyId/${encodeURIComponent(id)}`
  }
  if (route.path.startsWith('/v/')) {
    return `/v/${encodeURIComponent(id)}`
  }
  return ''
})

const homePath = computed(() => namespacePrefix.value || '/')
const orderStatusPath = computed(() => `${namespacePrefix.value}/orders/${encodeURIComponent(publicId.value)}`)

const summaryState = useState<CheckoutSummary | null>('checkout-summary', () => null)

if (import.meta.client && !summaryState.value) {
  const stored = sessionStorage.getItem('checkout-summary')
  if (stored) {
    try {
      summaryState.value = JSON.parse(stored) as CheckoutSummary
    } catch {
      // noop
    }
  }
}

const summaryOrder = computed(() => {
  const summary = summaryState.value
  if (!summary) return null
  if (!publicId.value) return summary
  if (summary.publicOrderId && summary.publicOrderId !== publicId.value) return null
  return summary
})

const { data: remoteOrder, pending, error } = await useFetch<RemoteOrder>(() => `/api/orders/${encodeURIComponent(publicId.value)}`, {
  key: `order-confirmation:${publicId.value}`,
  immediate: Boolean(publicId.value)
})

const statusError = computed(() => {
  if (!error.value) return null
  const status = (error.value as { statusCode?: number; status?: number })?.statusCode
    ?? (error.value as { status?: number })?.status
  return status ? `Request failed (HTTP ${status}).` : 'Request failed.'
})

const itemsSubtotal = computed(() => {
  const items = displayOrder.value?.items ?? []
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
})

type TimelineStep = {
  key: string
  status: string
  title: string
  description?: string
  timestamp?: string
  state: 'complete' | 'current' | 'upcoming'
}

const formatStatus = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const STATUS_FLOW = ['PLACED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const

const timelineSteps = computed<TimelineStep[]>(() => {
  const order = displayOrder.value
  if (!order) return []

  const history = Array.isArray(order.statusHistory) ? order.statusHistory : []
  const byStatus = new Map<string, string | undefined>()
  for (const entry of history) {
    const status = String(entry.status ?? '').trim()
    if (!status) continue
    if (!byStatus.has(status)) {
      byStatus.set(status, entry.createdAt)
    }
  }

  const currentStatusRaw = String(order.status ?? '').trim()
  const currentStatus = currentStatusRaw || (history.length ? String(history[history.length - 1]?.status ?? '').trim() : '')
  const currentIndex = STATUS_FLOW.includes(currentStatus as (typeof STATUS_FLOW)[number])
    ? STATUS_FLOW.indexOf(currentStatus as (typeof STATUS_FLOW)[number])
    : -1

  const getCopy = (status: string) => {
    if (status === 'PLACED') {
      return { title: 'Order placed', description: 'We’ve received your order and started processing it.' }
    }
    if (status === 'PACKED') {
      return { title: 'Packed and ready', description: 'Your items are packed and waiting for pickup.' }
    }
    if (status === 'SHIPPED') {
      return { title: 'Shipped', description: 'Your parcel is on the move to your address.' }
    }
    if (status === 'OUT_FOR_DELIVERY') {
      return { title: 'Out for delivery', description: 'Courier is delivering your parcel today.' }
    }
    if (status === 'DELIVERED') {
      return { title: 'Delivered', description: 'Your order has been delivered. Enjoy!' }
    }
    return { title: formatStatus(status) }
  }

  return STATUS_FLOW.map((status) => {
    const copy = getCopy(status)
    const index = STATUS_FLOW.indexOf(status)
    const state: TimelineStep['state'] =
      currentIndex === -1
        ? (byStatus.has(status) ? 'complete' : 'upcoming')
        : index < currentIndex
          ? 'complete'
          : index === currentIndex
            ? 'current'
            : 'upcoming'

    return {
      key: status,
      status,
      title: copy.title,
      description: copy.description,
      timestamp: byStatus.get(status),
      state
    }
  })
})

const progressPercent = computed(() => {
  const current = displayOrder.value?.status ? String(displayOrder.value.status).trim() : ''
  const idx = STATUS_FLOW.includes(current as (typeof STATUS_FLOW)[number])
    ? STATUS_FLOW.indexOf(current as (typeof STATUS_FLOW)[number])
    : -1
  if (idx <= 0) return 5
  const denom = Math.max(STATUS_FLOW.length - 1, 1)
  return Math.min(100, Math.max(5, Math.round((idx / denom) * 100)))
})

const currentStepCopy = computed(() => {
  const status = String(displayOrder.value?.status ?? '').trim()
  if (!status) return 'We’re preparing your order.'
  if (status === 'PLACED') return 'We’ve received your order and are preparing it.'
  if (status === 'PACKED') return 'Your order is packed and ready to ship.'
  if (status === 'SHIPPED') return 'Your order is on the way.'
  if (status === 'OUT_FOR_DELIVERY') return 'Your order is out for delivery.'
  if (status === 'DELIVERED') return 'Delivered. Thanks again for shopping with us.'
  return `Status: ${formatStatus(status)}`
})

const normalizedRemote = computed<DisplayOrder | null>(() => {
  const current = remoteOrder.value
  if (!current || !current.publicId) return null

  const items = (current.items ?? []).map((item) => ({
    id: item.id,
    name: item.product?.name?.trim() || 'Item',
    quantity: Number.isFinite(item.quantity) ? item.quantity : 1,
    price: typeof item.price === 'number' ? item.price : (typeof item.product?.price === 'number' ? item.product.price : 0)
  }))

  return {
    publicId: String(current.publicId),
    status: current.status,
    updatedAt: current.updatedAt,
    total: typeof current.total === 'number'
      ? current.total
      : items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    customer: current.customer ? {
      name: current.customer.name?.trim() || undefined,
      email: current.customer.email?.trim() || undefined,
      address: current.customer.address?.trim() || undefined
    } : undefined,
    items,
    statusHistory: (current.statusHistory ?? []).map((h) => ({
      status: String(h.status),
      createdAt: h.createdAt
    }))
  }
})

const displayOrder = computed<DisplayOrder | null>(() => {
  const summary = summaryOrder.value
  const remote = normalizedRemote.value

  if (!summary && !remote) return null

  const summaryPublicId = summary?.publicOrderId?.trim() || publicId.value.trim()
  const base: DisplayOrder | null = summary
    ? {
      publicId: summaryPublicId || '',
      status: remote?.status,
      updatedAt: remote?.updatedAt,
      total: summary.total,
      customer: {
        name: `${summary.shipping.firstName} ${summary.shipping.lastName}`.trim() || undefined,
        email: summary.email?.trim() || undefined,
        address: [summary.shipping.address, `${summary.shipping.city}, ${summary.shipping.postcode}`, summary.shipping.country]
          .filter(Boolean)
          .join('\n')
      },
      items: summary.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      statusHistory: remote?.statusHistory
    }
    : null

  if (base && base.publicId) return base
  return remote
})

const printReceipt = () => {
  if (import.meta.client) {
    window.print()
  }
}

const formatTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

useHead(() => ({
  title: publicId.value ? `Order ${publicId.value} – Commerce Demo` : 'Order confirmation – Commerce Demo'
}))
</script>

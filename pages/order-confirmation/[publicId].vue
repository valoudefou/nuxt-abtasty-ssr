<template>
  <div v-if="order" class="mt-10 space-y-10">
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
          <p class="mt-2 text-2xl font-semibold">{{ order.orderId }}</p>
          <p v-if="order.publicOrderId" class="mt-1 text-xs text-white/80">
            Confirmation ID: {{ order.publicOrderId }}
          </p>
          <p v-else-if="order.remoteOrderId" class="mt-1 text-xs text-white/80">
            Service ID: {{ order.remoteOrderId }}
          </p>
          <p v-else class="mt-1 text-xs text-white/80">Placed just now</p>
        </div>
      </div>
      <div class="mt-8 flex flex-wrap gap-4 text-sm text-white/80">
        <div class="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 backdrop-blur">
          <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
          Preparing your items
        </div>
        <div class="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 backdrop-blur">
          <span class="font-semibold text-white">{{ order.delivery.label }}</span>
          <span>•</span>
          Expected in 3–5 business days
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
            <span class="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
              Estimated {{ order.delivery.label.toLowerCase() }}
            </span>
          </div>
          <ol class="mt-6 space-y-5">
            <li
              v-for="(step, index) in fulfillmentSteps"
              :key="step.title"
              class="flex items-start gap-4"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                :class="{
                  'bg-primary-600 text-white shadow-primary-200 shadow-lg': step.status === 'complete',
                  'bg-primary-50 text-primary-700 ring-1 ring-primary-100': step.status === 'current',
                  'bg-slate-100 text-slate-400': step.status === 'upcoming'
                }"
              >
                {{ index + 1 }}
              </span>
              <div>
                <p class="font-semibold text-slate-900">{{ step.title }}</p>
                <p class="text-sm text-slate-600">{{ step.description }}</p>
              </div>
            </li>
          </ol>
        </section>

        <div class="grid gap-6 md:grid-cols-2">
          <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Shipping address</h3>
            <p class="mt-4 text-lg font-semibold text-slate-900">
              {{ order.shipping.firstName }} {{ order.shipping.lastName }}
            </p>
            <p class="mt-2 text-sm text-slate-600 leading-relaxed">
              {{ order.shipping.address }}<br />
              {{ order.shipping.city }}, {{ order.shipping.postcode }}<br />
              {{ order.shipping.country }}
            </p>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Delivery & billing</h3>
            <div class="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Delivery method</p>
                <p class="mt-1 text-base font-semibold text-slate-900">
                  {{ order.delivery.label }}
                </p>
                <p>{{ formatCurrency(order.delivery.cost) }}</p>
              </div>
              <div v-if="order.billing">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Billing address</p>
                <p class="mt-1 leading-relaxed">
                  {{ order.billing.address }}<br />
                  {{ order.billing.city }}, {{ order.billing.postcode }}<br />
                  {{ order.billing.country }}
                </p>
              </div>
              <p v-else class="text-slate-500">
                Billing information matches your shipping details.
              </p>
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
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-4">
                <div class="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                  <img :src="item.image" :alt="item.name" class="h-full w-full object-cover" />
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
            <div class="flex items-center justify-between">
              <dt>Delivery</dt>
              <dd class="font-semibold text-slate-900">{{ formatCurrency(order.delivery.cost) }}</dd>
            </div>
          </dl>
          <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 text-lg font-semibold text-slate-900">
            <span>Total paid</span>
            <span>{{ formatCurrency(order.total) }}</span>
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
        to="/"
        class="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
      >
        Continue shopping
      </NuxtLink>
      <NuxtLink
        v-if="order?.publicOrderId"
        :to="`/orders/${encodeURIComponent(order.publicOrderId)}`"
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
        :to="`/orders/${encodeURIComponent(publicId)}`"
        class="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
      >
        View order status
      </NuxtLink>
      <NuxtLink
        to="/"
        class="inline-flex items-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        Continue shopping
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '@/types/order'

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

const route = useRoute()
const publicId = computed(() => {
  const value = route.params.publicId
  if (Array.isArray(value)) return String(value[0] ?? '')
  return String(value ?? '')
})

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

const order = computed(() => {
  const summary = summaryState.value
  if (!summary) return null
  if (!publicId.value) return summary
  if (summary.publicOrderId && summary.publicOrderId !== publicId.value) return null
  return summary
})

const { data: remoteOrder, pending, error } = await useFetch<Order>(() => `/api/orders/${encodeURIComponent(publicId.value)}`, {
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
  const currentOrder = order.value
  if (!currentOrder) return 0
  return currentOrder.items.reduce((total, item) => total + item.price * item.quantity, 0)
})

const fulfillmentSteps = computed(() => {
  const currentOrder = order.value
  const deliveryLabel = currentOrder?.delivery.label ?? 'delivery'
  return [
    {
      title: 'Order confirmed',
      description: 'We’ve emailed your receipt and started preparing your package.',
      status: 'complete'
    },
    {
      title: 'Preparing to ship',
      description: `Our team is packing your items for ${deliveryLabel.toLowerCase()}.`,
      status: 'current'
    },
    {
      title: 'Out for delivery',
      description: 'You’ll get tracking details once the carrier picks up your parcel.',
      status: 'upcoming'
    }
  ] as const
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


<template>
  <div class="mx-auto mt-10 max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Order confirmation</p>
      <h1 class="text-2xl font-semibold text-slate-900">Redirecting…</h1>
      <p class="text-sm text-slate-600">
        If you are not redirected, return to your cart and place the order again.
      </p>
    </header>

    <NuxtLink
      :to="cartHref"
      class="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
    >
      Back to cart
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
type CheckoutSummary = {
  publicOrderId?: string
}

const summaryState = useState<CheckoutSummary | null>('checkout-summary', () => null)
const route = useRoute()

const companyIdParam = computed(() => route.params.companyId)
const companyId = computed(() => {
  const raw = companyIdParam.value
  return Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '')
})

const vendorPrefix = computed(() => {
  const id = companyId.value.trim()
  if (!id) return ''
  const encoded = encodeURIComponent(id)
  if (route.path.startsWith('/v/companyId/')) return `/v/companyId/${encoded}`
  if (route.path.startsWith('/v/')) return `/v/${encoded}`
  return ''
})

const cartHref = computed(() => {
  const prefix = vendorPrefix.value
  if (!prefix) return '/cart'
  return `${prefix}/cart`
})

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

const publicOrderId = summaryState.value?.publicOrderId?.trim() || ''
if (publicOrderId) {
  const encodedPublicOrderId = encodeURIComponent(publicOrderId)
  if (route.path.startsWith('/v/companyId/') && companyId.value) {
    await navigateTo(`/v/companyId/${encodeURIComponent(companyId.value)}/order-confirmation/${encodedPublicOrderId}`, { replace: true })
  } else if (route.path.startsWith('/v/') && companyId.value) {
    await navigateTo(`/v/${encodeURIComponent(companyId.value)}/order-confirmation/${encodedPublicOrderId}`, { replace: true })
  } else {
    await navigateTo(`/order-confirmation/${encodedPublicOrderId}`, { replace: true })
  }
}

useHead({ title: 'Order confirmation – Commerce Demo' })
</script>

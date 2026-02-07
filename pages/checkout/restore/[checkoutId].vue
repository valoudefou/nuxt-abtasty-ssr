<template>
  <div class="mx-auto max-w-xl space-y-4 px-4 py-16">
    <h1 class="text-2xl font-semibold text-slate-900">Restoring your checkout…</h1>
    <p class="text-sm text-slate-600">
      We’re putting your items back in the cart.
    </p>
    <p v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '@/types/product'

type CheckoutItem = {
  sku?: unknown
  name?: unknown
  quantity?: unknown
  price?: unknown
  product?: { sku?: unknown; name?: unknown; price?: unknown } | null
}

type CheckoutResponse = {
  id?: unknown
  checkoutId?: unknown
  token?: unknown
  checkoutToken?: unknown
  email?: unknown
  customer?: { name?: unknown; email?: unknown } | null
  shipping?: { firstName?: unknown; lastName?: unknown; address?: unknown; city?: unknown; postcode?: unknown; country?: unknown } | null
  items?: unknown
}

const CHECKOUT_SESSION_STORAGE_KEY = 'checkout-session'
const CHECKOUT_RESTORE_EMAIL_KEY = 'checkout-restore-email'
const CHECKOUT_DRAFT_KEY = 'checkout-draft'
const CHECKOUT_DRAFT_LAST_KEY = 'checkout-draft:last'
const checkoutDraftByIdKey = (id: string) => `checkout-draft:${id}`

const PLACEHOLDER_IMAGE = 'https://assets-manager.abtasty.com/placeholder.png'

const route = useRoute()
const router = useRouter()
const { state: cartState } = useCart()

const error = ref<string | null>(null)

const coerceString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const coerceNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const extractToken = (value: unknown) => {
  const raw = coerceString(value)
  if (!raw) return ''
  // Tokens sometimes get extra email text appended (newlines / "Items" section).
  return raw.split(/\s+/)[0] || ''
}

const normalizeItems = (items: unknown): Array<{ sku: string; name: string; quantity: number; price: number }> => {
  if (!Array.isArray(items)) return []
  return items.flatMap((entry: unknown, index: number) => {
    const item = (entry && typeof entry === 'object') ? (entry as CheckoutItem) : null
    const sku =
      coerceString(item?.sku)
      || coerceString(item?.product?.sku)
      || `RESTORE-SKU-${index + 1}`
    const name =
      coerceString(item?.name)
      || coerceString(item?.product?.name)
      || `Item ${index + 1}`
    const quantityRaw = typeof item?.quantity === 'number' ? item.quantity : Number.parseInt(String(item?.quantity ?? '1'), 10)
    const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1
    const price =
      coerceNumber(item?.price)
      ?? coerceNumber(item?.product?.price)
      ?? 0
    return [{ sku, name, quantity, price }]
  })
}

const toCartProduct = (normalized: { sku: string; name: string; quantity: number; price: number }): (Product & { quantity: number }) => ({
  id: normalized.sku,
  slug: encodeURIComponent(normalized.sku),
  name: normalized.name,
  description: '',
  price: normalized.price,
  category: 'Restored',
  image: PLACEHOLDER_IMAGE,
  rating: null,
  highlights: [],
  inStock: true,
  colors: [],
  sizes: [],
  sku: normalized.sku,
  quantity: normalized.quantity
})

const persistCheckoutSession = (checkoutId: string, checkoutToken: string) => {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(CHECKOUT_SESSION_STORAGE_KEY, JSON.stringify({ checkoutId, checkoutToken, restoredAt: Date.now() }))
  } catch {
    // ignore
  }
}

const persistRestoreEmail = (email: string) => {
  if (!import.meta.client) return
  if (!email) return
  try {
    sessionStorage.setItem(CHECKOUT_RESTORE_EMAIL_KEY, email)
  } catch {
    // ignore
  }
}

const persistDraft = (draft: Record<string, unknown>) => {
  if (!import.meta.client) return
  try {
    const serialized = JSON.stringify(draft)
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, serialized)
    localStorage.setItem(CHECKOUT_DRAFT_LAST_KEY, serialized)
  } catch {
    // ignore
  }
}

const splitName = (full: string) => {
  const trimmed = full.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '' }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') }
}

const resolveCheckoutId = () => {
  const paramId = route.params.checkoutId
  const fromParam = Array.isArray(paramId) ? coerceString(paramId[0]) : coerceString(paramId)
  const fromQuery = coerceString(route.query.checkoutId)
  return fromParam || fromQuery
}

const resolveToken = () => extractToken(route.query.token)

const checkoutPathForCurrentRoute = () => {
  const path = route.path || '/checkout'
  const marker = '/checkout/restore/'
  const idx = path.indexOf(marker)
  if (idx === -1) return '/checkout'
  const prefix = path.slice(0, idx)
  return `${prefix}${prefix.endsWith('/') ? '' : ''}/checkout`
}

onMounted(() => {
  void (async () => {
    const checkoutId = resolveCheckoutId()
    const token = resolveToken()
    if (!checkoutId || !token) {
      error.value = 'This restore link is missing information.'
      return
    }

    try {
      const data = await $fetch<unknown>(`/checkouts/${encodeURIComponent(checkoutId)}`, {
        method: 'GET',
        query: { token },
        credentials: 'omit'
      })

      const payload = (data && typeof data === 'object') ? (data as CheckoutResponse) : {}
      const restoredEmail =
        coerceString(payload.email)
        || coerceString(payload.customer?.email)
      const normalizedItems = normalizeItems(payload.items)

      if (!normalizedItems.length) {
        error.value = 'We could not find any items to restore for this checkout.'
        return
      }

      cartState.value.items = normalizedItems.map(toCartProduct)
      persistCheckoutSession(checkoutId, token)
      if (restoredEmail) {
        persistRestoreEmail(restoredEmail)
      }

      const restoredName = coerceString(payload.customer?.name)
      const { firstName, lastName } = splitName(restoredName)
      const draft = {
        firstName: coerceString(payload.shipping?.firstName) || firstName || undefined,
        lastName: coerceString(payload.shipping?.lastName) || lastName || undefined,
        email: restoredEmail || undefined,
        shipping: {
          address: coerceString(payload.shipping?.address) || undefined,
          city: coerceString(payload.shipping?.city) || undefined,
          postcode: coerceString(payload.shipping?.postcode) || undefined,
          country: coerceString(payload.shipping?.country) || undefined
        }
      }
      persistDraft(draft)
      try {
        localStorage.setItem(checkoutDraftByIdKey(checkoutId), JSON.stringify(draft))
      } catch {
        // ignore
      }

      await router.replace(checkoutPathForCurrentRoute())
    } catch (e) {
      console.error('Checkout restore failed', e)
      error.value = 'Failed to restore your checkout. Please try again.'
    }
  })()
})

useHead({ title: 'Restore checkout – Commerce Demo' })
</script>

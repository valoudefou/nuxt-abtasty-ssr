<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[60]"
        role="dialog"
        aria-modal="true"
        aria-label="Cart preview"
        @keydown.esc="requestClose"
      >
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="requestClose"></div>

        <div class="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
          <header class="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Cart</p>
              <h2 class="mt-1 text-lg font-semibold text-slate-900">
                {{ totalItems ? `${totalItems} item${totalItems === 1 ? '' : 's'}` : 'Your bag is empty' }}
              </h2>
            </div>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Close cart preview"
              @click="requestClose"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto px-6 py-6">
            <div v-if="!items.length" class="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <ShoppingBagIcon class="mx-auto h-10 w-10 text-slate-300" />
              <p class="mt-4 text-sm font-semibold text-slate-900">No products in your cart yet.</p>
              <p class="mt-2 text-sm text-slate-600">Browse the catalog and add your favorites.</p>
              <NuxtLink
                :to="cartHref"
                class="mt-6 inline-flex items-center rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
                @click="requestClose"
              >
                View cart
              </NuxtLink>
            </div>

            <ul v-else class="space-y-5">
              <li
                v-for="item in items"
                :key="`${item.id}:${item.selectedSize ?? ''}`"
                class="flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <img :src="item.image" :alt="item.name" class="h-20 w-20 rounded-2xl object-cover" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-slate-900">{{ item.name }}</p>
                      <p v-if="item.selectedSize" class="mt-1 text-xs font-medium text-slate-500">
                        Size <span class="font-mono text-slate-700">{{ item.selectedSize }}</span>
                      </p>
                    </div>
                    <p class="shrink-0 text-sm font-semibold text-primary-600">{{ formatCurrency(item.price) }}</p>
                  </div>
                  <div class="mt-3 flex flex-wrap items-center gap-3">
                    <div class="flex items-center rounded-full border border-slate-200">
                      <button
                        type="button"
                        class="px-3 py-1 text-sm"
                        aria-label="Decrease quantity"
                        @click="decrease(item.id, item.selectedSize)"
                      >
                        −
                      </button>
                      <span class="px-3 text-sm font-medium text-slate-700">{{ item.quantity }}</span>
                      <button
                        type="button"
                        class="px-3 py-1 text-sm"
                        aria-label="Increase quantity"
                        @click="increase(item.id, item.selectedSize)"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      class="text-xs font-semibold text-rose-500 hover:text-rose-600"
                      @click="remove(item.id, item.selectedSize)"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            </ul>

            <section v-if="items.length" class="mt-10 border-t border-slate-200 pt-8">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-sm font-semibold text-slate-900">Recommended for you</h3>
                  <p class="mt-1 text-xs font-semibold text-emerald-600">Powered by AB Tasty</p>
                </div>
              </div>

              <p
                v-if="recoError"
                class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {{ recoError }}
              </p>

              <div v-else-if="recoLoading" class="mt-4 space-y-3">
                <div class="h-4 w-40 rounded-full bg-slate-200/70"></div>
                <div class="h-32 w-full rounded-3xl bg-slate-200/60"></div>
              </div>

              <div v-else-if="hasRecommendations" class="mt-5 space-y-4">
                <article
                  v-for="rec in recommendations"
                  :key="rec.id"
                  class="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <NuxtLink
                    v-if="rec.detailUrl"
                    :to="rec.detailUrl"
                    class="block h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100"
                  >
                    <img :src="rec.product.image" :alt="rec.product.name" class="h-full w-full object-cover" />
                  </NuxtLink>
                  <a
                    v-else-if="rec.externalUrl"
                    :href="rec.externalUrl"
                    class="block h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <img :src="rec.product.image" :alt="rec.product.name" class="h-full w-full object-cover" />
                  </a>
                  <div v-else class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    <img :src="rec.product.image" :alt="rec.product.name" class="h-full w-full object-cover" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-2 text-sm font-semibold text-slate-900">
                      {{ rec.product.name }}
                    </p>
                    <p class="mt-1 text-sm font-semibold text-primary-600">{{ formatCurrency(rec.product.price) }}</p>
                  </div>

                  <button
                    type="button"
                    class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition hover:bg-primary-500"
                    aria-label="Add to cart"
                    @click="addRecommendationToCart(rec.product)"
                  >
                    <span class="sr-only">Add to cart</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-slot="icon" class="h-5 w-5">
                      <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"></path>
                    </svg>
                  </button>
                </article>
              </div>

              <p v-else class="mt-4 text-sm text-slate-500">
                No recommendations available right now.
              </p>
            </section>
          </div>

          <footer class="border-t border-slate-200 px-6 py-6">
            <div class="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span class="font-semibold text-slate-900">{{ formatCurrency(subtotal) }}</span>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <NuxtLink
                :to="cartHref"
                class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                @click="requestClose"
              >
                View cart
              </NuxtLink>
              <NuxtLink
                :to="checkoutHref"
                class="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:bg-slate-300"
                :class="{ 'pointer-events-none opacity-60': !items.length }"
                @click="requestClose"
              >
                Checkout
              </NuxtLink>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ShoppingBagIcon, XMarkIcon } from '@heroicons/vue/24/outline'

import type { Product } from '@/types/product'
import { type RecommendationParams, useRecommendations } from '@/composables/useRecommendations'

type Props = {
  open: boolean
  cartHref: string
  checkoutHref: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const requestClose = () => emit('update:open', false)

const route = useRoute()
const activeVendor = useState<string>('active-vendor', () => '')

const RECO_PLACEMENT_ID = 'd337f1d6-2232-4b0b-9f08-57a00b4024d0'

const { items, subtotal, totalItems, updateQuantity, removeItem, addItem } = useCart()
const { refreshRecommendations, stateFor } = useRecommendations()

const cartProductIds = computed<Array<string | number>>(() =>
  items.value
    .map((item) => item.id)
    .filter((id) => id !== null && id !== undefined)
)

const cartCategories = computed<string[]>(() => {
  const seen = new Set<string>()
  for (const item of items.value) {
    const category = item.category?.trim()
    if (category) {
      seen.add(category)
    }
  }
  return Array.from(seen)
})

const addedToCartProductId = computed<string | number | null>(() => {
  const ids = cartProductIds.value
  return ids.length ? ids[ids.length - 1] : null
})

const vendorId = computed(() => {
  const routeVendor = typeof route.params.companyId === 'string' ? route.params.companyId.trim() : ''
  return routeVendor || activeVendor.value?.trim() || null
})

const recommendationParams = computed<RecommendationParams>(() => ({
  filterField: 'cart_products',
  filterValue: cartProductIds.value.length ? cartProductIds.value : undefined,
  cartProductIds: cartProductIds.value.length ? cartProductIds.value : undefined,
  categoriesInCart: cartCategories.value.length ? cartCategories.value : undefined,
  addedToCartProductId: addedToCartProductId.value ?? undefined,
  placementId: RECO_PLACEMENT_ID,
  vendorId: vendorId.value
}))

const recommendationState = computed(() => stateFor(recommendationParams.value).value)
const recommendations = computed(() => (recommendationState.value.data?.items ?? []).slice(0, 8))
const hasRecommendations = computed(() => recommendations.value.length > 0)
const recoLoading = computed(() => recommendationState.value.pending && recommendationState.value.updatedAt === 0)
const recoError = computed(() => recommendationState.value.error)

const refreshCartRecommendations = (reason: string, options?: { background?: boolean }) => {
  if (!import.meta.client) return
  if (!props.open) return
  if (!cartProductIds.value.length) return
  void refreshRecommendations(recommendationParams.value, { reason, debounceMs: 150, ssr: false, background: options?.background ?? false })
}

const increase = (id: string | number, selectedSize?: string) => {
  const item = items.value.find((product) => product.id === id && (product.selectedSize ?? null) === (selectedSize ?? null))
  if (!item) return
  updateQuantity(id, item.quantity + 1, selectedSize)
}

const decrease = (id: string | number, selectedSize?: string) => {
  const item = items.value.find((product) => product.id === id && (product.selectedSize ?? null) === (selectedSize ?? null))
  if (!item) return
  const nextQuantity = Math.max(1, item.quantity - 1)
  updateQuantity(id, nextQuantity, selectedSize)
}

const remove = (id: string | number, selectedSize?: string) => removeItem(id, selectedSize)

const addRecommendationToCart = (product: Product) => addItem(product, 1)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

watch(
  () => props.open,
  (isOpen) => {
    if (!import.meta.client) return
    if (isOpen) {
      document.documentElement.classList.add('overflow-hidden')
      refreshCartRecommendations('drawer_open')
    } else {
      document.documentElement.classList.remove('overflow-hidden')
    }
  }
)

watch(
  () => cartProductIds.value.join(','),
  () => refreshCartRecommendations('cart_change', { background: true })
)

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.classList.remove('overflow-hidden')
})
</script>

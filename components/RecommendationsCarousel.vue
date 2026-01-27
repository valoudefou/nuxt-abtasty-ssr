<template>
  <section
    class="min-h-[360px] rounded-3xl border-slate-200 backdrop-blur relative"
    :aria-busy="loading ? 'true' : 'false'"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 class="section-title">{{ heading }}</h3>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-500 hover:text-primary-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          :disabled="!hasRecommendations || loading || !canScrollPrev"
          @click="scrollCarousel('prev')"
        >
          Prev
        </button>
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-500 hover:text-primary-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          :disabled="!hasRecommendations || loading || !canScrollNext"
          @click="scrollCarousel('next')"
        >
          Next
        </button>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ errorMessage }}
    </p>

    <template v-else-if="loading">
      <Transition name="reco-fade">
        <div class="mt-6 relative">
          <p class="sr-only" aria-live="polite">Finding the best recommendations…</p>
          <div class="flex gap-6 overflow-hidden pb-8 px-6 -mx-6">
            <div
              v-for="n in 3"
              :key="n"
              class="h-64 w-72 flex-shrink-0 rounded-3xl border border-slate-200 bg-white/60 shadow-sm"
            >
              <div class="h-48 w-full rounded-t-3xl bg-slate-200/70"></div>
              <div class="px-5 py-4 space-y-3">
                <div class="h-4 w-4/5 rounded-full bg-slate-200/80"></div>
                <div class="h-4 w-2/3 rounded-full bg-slate-200/70"></div>
                <div class="h-8 w-full rounded-full bg-slate-200/60"></div>
              </div>
            </div>
          </div>
          <div
            class="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white/75 backdrop-blur-sm text-slate-700"
            aria-live="polite"
          >
            <div class="reco-spinner h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-600"></div>
            <p class="mt-3 text-sm font-medium">Finding the best recommendations…</p>
          </div>
        </div>
      </Transition>
    </template>

    <div
      v-else-if="hasRecommendations"
      ref="carouselRef"
      class="mt-6 flex mb-10 gap-6 overflow-x-auto overflow-y-visible scroll-smooth pb-8 -mb-8 px-6 -mx-6"
    >
      <article
        v-for="item in recommendations"
        :key="item.id"
        class="reco-card relative flex w-72 flex-shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      >
        <button
          type="button"
          class="absolute right-[10px] top-[10px] z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 transition hover:text-rose-500"
          aria-label="Remove recommendation"
          @click.stop="dismissItem(item.id)"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div class="relative overflow-hidden rounded-2xl bg-slate-100">
          <img
            :src="item.product.image || placeholderImage"
            :alt="item.product.name"
            class="h-48 w-full object-cover transition duration-500 hover:scale-105"
          />
        </div>

        <div class="mt-4 flex items-start justify-between gap-3">
          <p class="text-base font-semibold text-slate-900">{{ item.product.name }}</p>
          <span class="text-base font-semibold text-primary-600">{{ formatCurrency(item.product.price) }}</span>
        </div>

        <a
          v-if="item.externalUrl"
          :href="item.externalUrl"
          class="mt-2 block text-sm text-slate-600"
          @click="logExternalLink(item.externalUrl)"
        >
          <span class="line-clamp-3">
            {{ item.product.description }}
          </span>
        </a>
        <NuxtLink
          v-else-if="item.detailUrl"
          :to="item.detailUrl"
          class="mt-2 block text-sm text-slate-600"
        >
          <span class="line-clamp-3">
            {{ item.product.description }}
          </span>
        </NuxtLink>
        <p v-else class="mt-2 text-sm text-slate-600 line-clamp-3">
          {{ item.product.description }}
        </p>

        <div class="mt-6 flex flex-row items-center gap-3">
          <button
            type="button"
            class="inline-flex basis-1/3 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 p-2 text-white shadow-sm transition hover:bg-primary-500"
            @click="addRecommendationToCart(item)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              class="h-5 w-5"
            >
              <path
                d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
              />
            </svg>
          </button>

          <a
            v-if="item.externalUrl"
            :href="item.externalUrl"
            class="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            @click="logExternalLink(item.externalUrl)"
          >
            View detail
          </a>

          <NuxtLink
            v-else-if="item.detailUrl"
            :to="item.detailUrl"
            class="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            View detail
          </NuxtLink>
        </div>
      </article>
    </div>

    <p v-else-if="recommendationsLoaded" class="mt-4 text-sm text-slate-500">
      There are no recommendations available right now. Please check back later.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { flagshipLogStore, type FlagshipLogLevel } from '@/utils/flagship/logStore'
import type { Product } from '@/types/product'
import { type RecommendationParams, useRecommendations } from '@/composables/useRecommendations'

const placeholderImage = 'https://assets-manager.abtasty.com/placeholder.png'

type RecommendationField = 'brand' | 'homepage' | 'category' | 'cart_products' | 'viewed_items'

type RecommendationItem = {
  id: string
  product: Product
  detailUrl?: string
  externalUrl?: string
}

const props = defineProps<{
  filterValue?: string | Array<string | number> | number
  filterField?: RecommendationField
  cartCategories?: string[]
  addedToCartProductId?: string | number | null
  viewingItemId?: string | number | null
  viewingItemSku?: string | number | null
  cartProductIds?: Array<string | number>
  placementId?: string
}>()

const logClientRecommendationEvent = (
  level: FlagshipLogLevel,
  message: string,
  payload?: Record<string, unknown>
) => {
  flagshipLogStore.addLog({
    timestamp: new Date().toISOString(),
    level,
    tag: 'recommendations',
    message,
    ...payload
  })
}

const runtimeConfig = useRuntimeConfig()
const strategyNames = runtimeConfig.public?.recommendations?.strategyNames as
  | Partial<Record<RecommendationField, string>>
  | undefined
const strategyIds = runtimeConfig.public?.recommendations?.strategyIds as
  | Partial<Record<RecommendationField, string>>
  | undefined
const getStrategyName = (field?: RecommendationField) =>
  (strategyNames?.[field ?? 'brand'] || strategyNames?.brand || 'Recommended for you')
const getStrategyId = (field?: RecommendationField) =>
  strategyIds?.[field ?? 'brand']

const isArrayFilter = (field?: string) => field === 'cart_products' || field === 'viewed_items'

const cart = useCart()
const cartHydrated = useState<boolean>('cart-storage-hydrated', () => false)
const { getRecommendations, refreshRecommendations, stateFor, buildKey } = useRecommendations()

const activeFilterField = computed<RecommendationField>(() => props.filterField ?? 'brand')

const normalizeFilterValue = (value?: string | Array<string | number> | number, field?: string) => {
  if (isArrayFilter(field)) {
    const arr = Array.isArray(value) ? value : value !== undefined && value !== null ? [value] : []
    return arr
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'all') {
    return ''
  }
  return trimmed
}

const normalizeCategories = (categories: string[]) => {
  const set = new Set<string>()
  for (const category of categories) {
    const trimmed = category.trim()
    if (trimmed) {
      set.add(trimmed)
    }
  }
  return Array.from(set)
}

const normalizeIdParam = (value?: string | number | null) => {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

const cartProductContextIds = computed(() => {
  const raw =
    Array.isArray(props.cartProductIds) && props.cartProductIds.length > 0
      ? props.cartProductIds
      : cart.items.value.map((item) => item.id)
  return raw
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0)
    .sort((a, b) => a.localeCompare(b))
})

const cartCategoryFilters = computed(() => {
  if (Array.isArray(props.cartCategories) && props.cartCategories.length > 0) {
    return normalizeCategories(props.cartCategories)
  }

  const categories = cart.items.value.map((item) => item.category || '').filter(Boolean)
  return normalizeCategories(categories)
})

const activeFilterValue = computed(() =>
  normalizeFilterValue(props.filterValue ?? 'All', activeFilterField.value)
)

const addedToCartProductId = computed(() => normalizeIdParam(props.addedToCartProductId))
const viewingItemId = computed(() => normalizeIdParam(props.viewingItemId ?? null))
const viewingItemSku = computed(() => {
  if (props.viewingItemSku === null || props.viewingItemSku === undefined) {
    return null
  }
  const normalized = String(props.viewingItemSku).trim()
  return normalized.length > 0 ? normalized : null
})
const placementId = computed(() => {
  if (!props.placementId) {
    return undefined
  }
  const normalized = props.placementId.trim()
  return normalized.length > 0 ? normalized : undefined
})

const recommendationParams = computed<RecommendationParams>(() => {
  const field = activeFilterField.value
  const base: RecommendationParams = {
    filterField: field,
    filterValue: activeFilterValue.value,
    cartProductIds: cartProductContextIds.value.length > 0 ? cartProductContextIds.value : undefined,
    placementId: placementId.value
  }

  if (field === 'cart_products') {
    return {
      ...base,
      categoriesInCart: cartCategoryFilters.value.length > 0 ? cartCategoryFilters.value : undefined,
      addedToCartProductId: addedToCartProductId.value ?? undefined
    }
  }

  if (field === 'viewed_items') {
    return {
      ...base,
      viewingItemId: viewingItemId.value ?? undefined,
      viewingItemSku: viewingItemSku.value ?? undefined
    }
  }

  return base
})

const recommendationKey = computed(() => buildKey(recommendationParams.value))
const recommendationState = computed(() => stateFor(recommendationParams.value).value)

const heading = computed(
  () => recommendationState.value.data?.title?.trim() || getStrategyName(activeFilterField.value)
)

const recommendations = computed<RecommendationItem[]>(
  () => recommendationState.value.data?.items ?? []
)

const hasRecommendations = computed(() => recommendations.value.length > 0)
const loading = computed(
  () => recommendationState.value.pending && recommendationState.value.updatedAt === 0
)
const errorMessage = computed(() => recommendationState.value.error)
const recommendationsLoaded = computed(
  () => recommendationState.value.updatedAt > 0 || recommendationState.value.error !== null
)

const carouselRef = ref<HTMLDivElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})

const hydratedLogKey = ref<string | null>(null)
const logRecommendationsEvent = (key: string, count: number) => {
  if (!import.meta.client || hydratedLogKey.value === key) return
  logClientRecommendationEvent('INFO', 'Recommendations loaded', {
    Variables: key,
    count,
    recommendationName: heading.value,
    recommendationId: placementId.value || getStrategyId(activeFilterField.value)
  })
  hydratedLogKey.value = key
}

if (import.meta.server) {
  await getRecommendations(recommendationParams.value, {
    reason: 'init',
    debounceMs: 0,
    ssr: true
  })
}

const updateScrollState = () => {
  const el = carouselRef.value

  if (!el) {
    canScrollPrev.value = false
    canScrollNext.value = false
    return
  }

  canScrollPrev.value = el.scrollLeft > 0
  canScrollNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

let detachScrollListener: (() => void) | null = null

const attachScrollListener = () => {
  if (detachScrollListener) {
    detachScrollListener()
    detachScrollListener = null
  }

  const el = carouselRef.value
  if (!el) return

  const handleScroll = () => updateScrollState()
  el.addEventListener('scroll', handleScroll, { passive: true })
  detachScrollListener = () => el.removeEventListener('scroll', handleScroll)
}

const syncCarousel = async () => {
  if (!import.meta.client) {
    return
  }

  await nextTick()
  if (!hasRecommendations.value) {
    if (detachScrollListener) {
      detachScrollListener()
      detachScrollListener = null
    }
    updateScrollState()
    return
  }

  attachScrollListener()
  updateScrollState()
}

const dismissItem = (id: string) => {
  const next = recommendations.value.filter((item) => item.id !== id)
  if (recommendationState.value.data) {
    recommendationState.value.data = {
      ...recommendationState.value.data,
      items: next
    }
  }
  void syncCarousel()
}

const formatCurrency = (value: number) => currencyFormatter.format(value)

const addRecommendationToCart = (item: RecommendationItem) => {
  cart.addItem(item.product)
}

const logExternalLink = (url?: string) => {
  if (!url) return
  console.log('[Recommendations] link click', { link: url })
}

const scrollCarousel = (direction: 'prev' | 'next') => {
  const el = carouselRef.value
  if (!el) return

  const card = el.querySelector<HTMLElement>('.reco-card')
  const step = card ? card.getBoundingClientRect().width + 24 : 300

  el.scrollBy({
    left: direction === 'next' ? step : -step,
    behavior: 'smooth'
  })
}

const handleResize = () => updateScrollState()

watch(
  () => recommendations.value.length,
  () => {
    void syncCarousel()
  }
)

watch(
  recommendationKey,
  (nextKey, prevKey) => {
    if (nextKey === prevKey) return
    void getRecommendations(recommendationParams.value, {
      reason: prevKey ? 'filters' : 'init',
      background: true,
      debounceMs: 120
    })
  },
  { immediate: import.meta.client }
)

watch(
  () => recommendationState.value.updatedAt,
  (updatedAt) => {
    if (!updatedAt || !hasRecommendations.value) return
    logRecommendationsEvent(recommendationKey.value, recommendations.value.length)
  }
)

const hasInitialized = ref(false)

const triggerInitialFetch = () => {
  if (hasInitialized.value) return
  hasInitialized.value = true
  void getRecommendations(recommendationParams.value, {
    reason: 'init',
    background: true,
    debounceMs: 0
  })
  void syncCarousel()
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('resize', handleResize)
  }

  if (!import.meta.client) return
  if (cartHydrated.value) {
    triggerInitialFetch()
  }
})

watch(
  () => cartHydrated.value,
  (hydrated) => {
    if (!import.meta.client || !hydrated) return
    triggerInitialFetch()
  }
)

watch(
  () => cart.items.value.map((item) => `${item.id}:${item.quantity}`),
  () => {
    if (!hasInitialized.value) return
    if (!import.meta.client) return
    void refreshRecommendations(recommendationParams.value, {
      reason: 'cart',
      background: true,
      debounceMs: 220,
      force: true
    })
  }
)

onBeforeUnmount(() => {
  if (detachScrollListener) {
    detachScrollListener()
    detachScrollListener = null
  }

  if (import.meta.client) {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.reco-spinner {
  animation: reco-spin 0.9s linear infinite;
}

.reco-fade-enter-active,
.reco-fade-leave-active {
  transition: opacity 220ms ease;
}

.reco-fade-enter-from,
.reco-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .reco-spinner {
    animation: none;
  }

  .reco-fade-enter-active,
  .reco-fade-leave-active {
    transition: none;
  }
}

@keyframes reco-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <section class="rounded-3xl border-slate-200 backdrop-blur">
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

    <div v-else-if="loading" class="mt-6 flex gap-6 overflow-hidden">
      <div v-for="n in 3" :key="n" class="h-64 w-72 flex-shrink-0 rounded-3xl bg-slate-100"></div>
    </div>

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

        <NuxtLink
          v-if="item.detailUrl"
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

          <NuxtLink
            v-if="item.detailUrl"
            :to="item.detailUrl"
            class="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            View detail
          </NuxtLink>

          <a
            v-else-if="item.externalUrl"
            :href="item.externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            View detail
          </a>
        </div>
      </article>
    </div>

    <p v-else class="mt-4 text-sm text-slate-500">
      There are no recommendations available right now. Please check back later.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { flagshipLogStore, type FlagshipLogLevel } from '@/utils/flagship/logStore'
import type { Product } from '@/types/product'

const placeholderImage = 'https://assets-manager.abtasty.com/placeholder.png'

type RecommendationField = 'brand' | 'homepage' | 'category' | 'cart_products' | 'viewed_items'

type RecommendationItem = {
  id: string
  product: Product
  detailUrl?: string
  externalUrl?: string
}

type RecommendationPayload = {
  title: string
  items: RecommendationItem[]
}

const props = defineProps<{
  filterValue?: string | number[] | number
  filterField?: RecommendationField
  cartCategories?: string[]
  addedToCartProductId?: number | null
  viewingItemId?: number | null
  cartProductIds?: number[]
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

const headingState = useState<string>(
  'recommendations-heading',
  () => getStrategyName(props.filterField)
)
const recommendations = useState<RecommendationItem[]>('recommendations-items', () => [])
const recommendationsLoaded = useState<boolean>('recommendations-loaded', () => false)
const recommendationsLoading = useState<boolean>('recommendations-loading', () => false)
const recommendationsError = useState<string | null>('recommendations-error', () => null)
const recommendationsFilterKey = useState<string>('recommendations-filter-key', () => '')
const hydratedLogKey = ref<string | null>(null)

const activeFilterValue = computed(() => props.filterValue ?? 'All')
const activeFilterField = computed<RecommendationField>(
  () => props.filterField ?? 'brand'
)
const cartCategoryFilters = computed(() => props.cartCategories ?? [])
const addedToCartProductId = computed(() => props.addedToCartProductId ?? null)
const viewingItemId = computed(() => props.viewingItemId ?? null)
const cartProductContextIds = computed(() =>
  Array.isArray(props.cartProductIds)
    ? props.cartProductIds.filter((id) => Number.isFinite(Number(id))).map((id) => Number(id))
    : []
)

const normalizeFilterValue = (value?: string | number[] | number, field?: string) => {
  if (isArrayFilter(field)) {
    const arr = Array.isArray(value) ? value : typeof value === 'number' ? [value] : []
    return arr.filter((item) => Number.isFinite(item)).map((item) => Number(item))
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

const getFilterKey = (value: string | number[] | number, field: string) => {
  if (isArrayFilter(field)) {
    const arr = Array.isArray(value) ? value : typeof value === 'number' ? [value] : []
    return `${field}:${arr.sort().join(',')}`
  }
  if (typeof value === 'string') {
    return `${field}:${value.trim().toLowerCase()}`
  }
  return field
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


let recommendationsRequestId = 0

const logHydratedRecommendations = (
  filterKey: string,
  recommendationName: string,
  recommendationId?: string
) => {
  if (!import.meta.client) return
  if (hydratedLogKey.value === filterKey) return

  logClientRecommendationEvent('INFO', 'Recommendations restored from cache', {
    Variables: filterKey,
    count: recommendations.value.length,
    recommendationName,
    recommendationId
  })

  hydratedLogKey.value = filterKey
}

const ensureRecommendations = async (
  value?: string | number[] | number,
  field?: RecommendationField
) => {
  const normalizedValue = normalizeFilterValue(value, field)
  const filterField = field ?? activeFilterField.value
  const strategyName = getStrategyName(filterField)
  const strategyId = getStrategyId(filterField)
  const normalizedCategories =
    filterField === 'cart_products' ? normalizeCategories(cartCategoryFilters.value) : []
  const normalizedAddedProductId =
    filterField === 'cart_products' ? addedToCartProductId.value : null
  const normalizedViewingItemId =
    filterField === 'viewed_items' ? viewingItemId.value : null
  const normalizedCartProducts = cartProductContextIds.value

  if (
    isArrayFilter(filterField)
    && Array.isArray(normalizedValue)
    && normalizedValue.length === 0
  ) {
    recommendations.value = []
    recommendationsLoaded.value = true
    recommendationsFilterKey.value = filterField
    recommendationsError.value = null
    return
  }

  const hasValue =
    normalizedValue && (Array.isArray(normalizedValue) ? normalizedValue.length > 0 : true)

  let filterKey = hasValue ? getFilterKey(normalizedValue, filterField) : filterField
  if (filterField === 'cart_products' && normalizedCategories.length > 0) {
    filterKey += `|categories:${normalizedCategories.sort().join(',')}`
  }
  if (filterField === 'cart_products' && normalizedAddedProductId !== null) {
    filterKey += `|added:${normalizedAddedProductId}`
  }
  if (filterField === 'viewed_items' && typeof normalizedViewingItemId === 'number') {
    filterKey += `|viewing:${normalizedViewingItemId}`
  }
  if (normalizedCartProducts.length > 0) {
    filterKey += `|cart:${normalizedCartProducts.sort().join(',')}`
  }

  if (recommendationsLoaded.value && recommendationsFilterKey.value === filterKey) {
    logHydratedRecommendations(filterKey, headingState.value || strategyName, strategyId)
    return
  }

  const requestId = ++recommendationsRequestId
  recommendationsLoading.value = true
  recommendationsError.value = null
  try {
    const payload = await $fetch<RecommendationPayload>('/api/recommendations', {
      method: 'POST',
      body: {
        filterField,
        filterValue: normalizedValue ?? null,
        categoriesInCart: filterField === 'cart_products' ? normalizedCategories : undefined,
        addedToCartProductId:
          filterField === 'cart_products' && normalizedAddedProductId !== null
            ? normalizedAddedProductId
            : undefined,
        viewingItemId:
          filterField === 'viewed_items' && typeof normalizedViewingItemId === 'number'
            ? normalizedViewingItemId
            : undefined,
        cartProductIds: normalizedCartProducts.length > 0 ? normalizedCartProducts : undefined
      }
    })

    if (requestId !== recommendationsRequestId) {
      return
    }

    headingState.value = payload?.title?.trim() || getStrategyName(filterField)
    recommendations.value = payload?.items ?? []
    recommendationsFilterKey.value = filterKey
    recommendationsLoaded.value = true
    logClientRecommendationEvent('INFO', 'Recommendations loaded', {
      Variables: filterKey,
      count: recommendations.value.length,
      recommendationName: headingState.value,
      recommendationId: strategyId
    })
    hydratedLogKey.value = filterKey
  } catch (err) {
    if (requestId === recommendationsRequestId) {
      console.error('Failed to load recommendations', err)
      recommendationsError.value = 'Unable to load recommendations right now.'
      // Store attempted key to avoid re-trigger loops until filters change
      recommendationsFilterKey.value = filterKey
      headingState.value = getStrategyName(filterField)
      logClientRecommendationEvent('ERROR', 'Failed to load recommendations', {
        Variables: filterKey,
        error: err instanceof Error ? err.message : String(err),
        recommendationName: headingState.value || strategyName,
        recommendationId: strategyId
      })
    }
  } finally {
    if (requestId === recommendationsRequestId) {
      recommendationsLoading.value = false
    }
  }
}

await ensureRecommendations(activeFilterValue.value, activeFilterField.value)

const heading = computed(() => headingState.value)

const carouselRef = ref<HTMLDivElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)

const cart = useCart()

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})

const hasRecommendations = computed(() => recommendations.value.length > 0)
const loading = computed(() => recommendationsLoading.value && !recommendationsLoaded.value)
const errorMessage = computed(() => recommendationsError.value)

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
  recommendations.value = recommendations.value.filter((item) => item.id !== id)
  void syncCarousel()
}

const formatCurrency = (value: number) => currencyFormatter.format(value)

const addRecommendationToCart = (item: RecommendationItem) => {
  cart.addItem(item.product)
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
  () => [
    activeFilterValue.value,
    activeFilterField.value,
    cartCategoryFilters.value,
    addedToCartProductId.value,
    viewingItemId.value,
    cartProductContextIds.value
  ] as const,
  ([value, field, , addedId, viewingId, cartIds]) => {
    const normalizedValue = normalizeFilterValue(value, field)
    const normalizedCategories =
      field === 'cart_products' ? normalizeCategories(cartCategoryFilters.value) : []
    let filterKey =
      normalizedValue && (Array.isArray(normalizedValue) ? normalizedValue.length > 0 : true)
        ? getFilterKey(normalizedValue, field)
        : field

    if (field === 'cart_products' && normalizedCategories.length > 0) {
      filterKey += `|categories:${normalizedCategories.sort().join(',')}`
    }
    if (field === 'cart_products' && typeof addedId === 'number') {
      filterKey += `|added:${addedId}`
    }
    if (field === 'viewed_items' && typeof viewingId === 'number') {
      filterKey += `|viewing:${viewingId}`
    }
    if (Array.isArray(cartIds) && cartIds.length > 0) {
      filterKey += `|cart:${[...cartIds].sort().join(',')}`
    }

    if (filterKey === recommendationsFilterKey.value) {
      return
    }
    void ensureRecommendations(value, field)
  }
)

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('resize', handleResize)
  }

  void syncCarousel()
})

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

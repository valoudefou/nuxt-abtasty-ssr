<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <div class="rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 p-6 shadow-sm ring-1 ring-rose-100 sm:p-10">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">Seasonal edit</p>
            <h1 class="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Valentines Day
              <input
                v-model.trim="headlineWord"
                type="text"
                class="inline-block w-28 border-b border-dashed border-rose-300 bg-transparent text-center font-semibold text-rose-600 focus:border-rose-400 focus:outline-none"
                aria-label="Edit headline word"
              />
            </h1>
            <p class="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Thoughtful picks with heart-forward details, curated for cozy nights, elegant surprises, and everyday romance.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="rounded-full border border-rose-200 bg-white/70 px-6 py-3 text-sm font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
              @click="clearAll"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

    </section>

    <div class="lg:grid lg:grid-cols-[280px,1fr] lg:items-start lg:gap-8">
      <aside class="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <div class="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
          <div class="flex items-center justify-end">
            <button
              v-if="hasActiveFilters"
              type="button"
              class="text-xs font-semibold text-primary-600 hover:text-primary-500"
              @click="clearAll"
            >
              Clear
            </button>
          </div>

          <div class="mt-5 space-y-6">
            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</p>
              <select
                v-model="sortOption"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Brands</p>
                <button
                  v-if="selectedBrands.length"
                  type="button"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                  @click="clearBrands"
                >
                  Reset
                </button>
              </div>
              <div v-if="showBrandSearch" class="relative">
                <input
                  v-model="brandSearch"
                  type="search"
                  name="brand-search"
                  class="w-full rounded-full border border-slate-200 px-4 py-2 text-xs shadow-sm outline-none transition focus:border-primary-400 focus:ring-primary-200"
                  placeholder="Search brands"
                  aria-label="Search brands"
                />
              </div>
              <div class="max-h-56 space-y-2 overflow-y-auto pr-2">
                <label
                  v-for="brand in filteredBrandOptions"
                  :key="brand"
                  class="flex items-center gap-2 text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-300"
                    :checked="selectedBrands.includes(brand)"
                    @change="toggleBrand(brand)"
                  />
                  <span>{{ brand }}</span>
                </label>
                <p v-if="!filteredBrandOptions.length" class="text-xs text-slate-400">No brands match.</p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p>
                <button
                  v-if="priceMin !== null || priceMax !== null"
                  type="button"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                  @click="clearPrice"
                >
                  Reset
                </button>
              </div>
              <div class="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div class="flex flex-col gap-3">
                  <label class="flex flex-col text-xs font-semibold text-slate-500">
                    Min
                    <input
                      v-model="minPriceInput"
                      type="number"
                      min="0"
                      inputmode="decimal"
                      class="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      :placeholder="formatCurrency(priceBounds.min)"
                    />
                  </label>
                  <label class="flex flex-col text-xs font-semibold text-slate-500">
                    Max
                    <input
                      v-model="maxPriceInput"
                      type="number"
                      min="0"
                      inputmode="decimal"
                      class="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      :placeholder="formatCurrency(priceBounds.max)"
                    />
                  </label>
                </div>
                <div class="relative pt-5 pb-2">
                  <div class="pointer-events-none absolute inset-x-1 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200">
                    <div
                      class="absolute h-2 rounded-full bg-primary-300"
                      :style="{ left: priceFillStyle.left, right: priceFillStyle.right }"
                    />
                  </div>
                  <input
                    type="range"
                    :min="priceBounds.min"
                    :max="priceBounds.max"
                    :step="PRICE_SLIDER_STEP"
                    :value="sliderMinValue"
                    class="range-input absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 transform cursor-pointer"
                    aria-label="Minimum price"
                    @input="handleMinPriceInput"
                  />
                  <input
                    type="range"
                    :min="priceBounds.min"
                    :max="priceBounds.max"
                    :step="PRICE_SLIDER_STEP"
                    :value="sliderMaxValue"
                    class="range-input absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 transform cursor-pointer"
                    aria-label="Maximum price"
                    @input="handleMaxPriceInput"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </aside>

      <div class="space-y-6">
        <div class="sticky top-24 z-20 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur lg:hidden">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-slate-900">Filter the collection</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-primary-300 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
              @click="openFilterDrawer"
            >
              Filters
            </button>
          </div>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="mt-3 text-xs font-semibold text-primary-600 transition hover:text-primary-500"
            @click="clearAll"
          >
            Clear all
          </button>
        </div>

        <p class="sr-only" aria-live="polite">{{ filteredProducts.length }} products shown.</p>

        <section id="valentines-products">
          <div v-if="pending && !visibleProducts.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="index in 8" :key="index" class="h-80 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="h-48 rounded-2xl bg-slate-100"></div>
              <div class="mt-5 space-y-3">
                <div class="h-3 w-24 rounded-full bg-slate-100"></div>
                <div class="h-4 w-40 rounded-full bg-slate-100"></div>
                <div class="h-3 w-32 rounded-full bg-slate-100"></div>
              </div>
            </div>
          </div>

          <div v-else-if="error" class="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            <p>We couldn’t load Valentines Day gifts right now.</p>
            <button
              type="button"
              class="mt-4 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              @click="handleRetry"
            >
              Retry
            </button>
          </div>

          <div v-else class="space-y-8">
            <div v-if="isAutocompleteLoading" class="flex items-center gap-2 text-xs text-slate-400">
              <span class="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-primary-500"></span>
              Loading gift suggestions…
            </div>
            <div
              v-else-if="giftSuggestionChips.length && !giftSearchNormalized"
              class="flex flex-wrap gap-2"
            >
              <button
                v-for="suggestion in giftSuggestionChips"
                :key="suggestion"
                type="button"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-primary-400 hover:text-primary-600"
                @click="applySuggestion(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>
            <div v-else-if="giftSearchNormalized" class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span class="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700">
                {{ giftSearchNormalized }}
              </span>
              <button
                type="button"
                class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                @click="clearGiftSearch"
              >
                Clear gift search
              </button>
            </div>
            <div v-if="pending" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary-500"></span>
              Updating results…
            </div>
            <div
              v-if="!pending && !visibleProducts.length"
              class="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-base font-semibold text-slate-600 shadow-sm"
            >
            </div>
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ValentinesProductCard
                v-for="product in visibleProducts"
                :key="product.id"
                :product="product"
              />
            </div>

            <div class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
              <button
                type="button"
                class="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canLoadMore || pending"
                @click="loadMore"
              >
                {{ pending ? 'Loading…' : (canLoadMore ? 'Load more gifts' : 'All gifts loaded') }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isFilterDrawerOpen"
        class="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm lg:hidden"
        @click.self="closeFilterDrawer"
      >
        <div class="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl bg-white p-6 shadow-2xl">
          <div class="flex items-center justify-between">
            <span></span>
            <button
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              @click="closeFilterDrawer"
            >
              Close
            </button>
          </div>
          <div class="mt-6 space-y-6 overflow-y-auto pb-8">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Brands</p>
                <button
                  v-if="selectedBrands.length"
                  type="button"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                  @click="clearBrands"
                >
                  Reset
                </button>
              </div>
              <div v-if="showBrandSearch" class="relative">
                <input
                  v-model="brandSearch"
                  type="search"
                  name="brand-search-mobile"
                  class="w-full rounded-full border border-slate-200 px-4 py-2 text-xs shadow-sm outline-none transition focus:border-primary-400 focus:ring-primary-200"
                  placeholder="Search brands"
                  aria-label="Search brands"
                />
              </div>
              <div class="max-h-52 space-y-2 overflow-y-auto pr-2">
                <label
                  v-for="brand in filteredBrandOptions"
                  :key="brand"
                  class="flex items-center gap-2 text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-300"
                    :checked="selectedBrands.includes(brand)"
                    @change="toggleBrand(brand)"
                  />
                  <span>{{ brand }}</span>
                </label>
                <p v-if="!filteredBrandOptions.length" class="text-xs text-slate-400">No brands match.</p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p>
                <button
                  v-if="priceMin !== null || priceMax !== null"
                  type="button"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                  @click="clearPrice"
                >
                  Reset
                </button>
              </div>
              <div class="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div class="flex flex-col gap-3">
                  <label class="flex flex-col text-xs font-semibold text-slate-500">
                    Min
                    <input
                      v-model="minPriceInput"
                      type="number"
                      min="0"
                      inputmode="decimal"
                      class="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      :placeholder="formatCurrency(priceBounds.min)"
                    />
                  </label>
                  <label class="flex flex-col text-xs font-semibold text-slate-500">
                    Max
                    <input
                      v-model="maxPriceInput"
                      type="number"
                      min="0"
                      inputmode="decimal"
                      class="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      :placeholder="formatCurrency(priceBounds.max)"
                    />
                  </label>
                </div>
                <div class="relative pt-5 pb-2">
                  <div class="pointer-events-none absolute inset-x-1 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200">
                    <div
                      class="absolute h-2 rounded-full bg-primary-300"
                      :style="{ left: priceFillStyle.left, right: priceFillStyle.right }"
                    />
                  </div>
                  <input
                    type="range"
                    :min="priceBounds.min"
                    :max="priceBounds.max"
                    :step="PRICE_SLIDER_STEP"
                    :value="sliderMinValue"
                    class="range-input absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 transform cursor-pointer"
                    aria-label="Minimum price"
                    @input="handleMinPriceInput"
                  />
                  <input
                    type="range"
                    :min="priceBounds.min"
                    :max="priceBounds.max"
                    :step="PRICE_SLIDER_STEP"
                    :value="sliderMaxValue"
                    class="range-input absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 transform cursor-pointer"
                    aria-label="Maximum price"
                    @input="handleMaxPriceInput"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</p>
              <select
                v-model="sortOption"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-md"
                @click="closeFilterDrawer"
              >
                View results
              </button>
              <button
                type="button"
                class="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
                @click="clearAll"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'

import type { Product } from '@/types/product'
import ValentinesProductCard from '@/components/ValentinesProductCard.vue'

type SortOption = 'featured' | 'price-asc' | 'price-desc'

const PRODUCTS_ENDPOINT = '/api/valentines-products'
const PRICE_SLIDER_STEP = 1
const PRICE_FALLBACK_MIN = 0
const PRICE_FALLBACK_MAX = 500
const ITEMS_PER_BATCH = 24
const SEARCH_ENDPOINT = '/api/abtasty-search'
const SEARCH_HITS_PER_PAGE = 48
const SEARCH_PLACEHOLDER_IMAGE = 'https://assets-manager.abtasty.com/placeholder.png'

const route = useRoute()
const router = useRouter()

type ValentinesResponse = {
  products?: Product[]
  fetchedAt?: number
}

type SearchHit = {
  id: string | number
  name?: string
  img_link?: string
  link?: string
  price?: number | string | null
  sku?: string | number | null
  brand?: string | null
  vendor?: string | null
  category_id?: string | null
  categories_ids?: string[] | null
  description?: string | null
}

type SearchResponse = {
  hits?: SearchHit[]
}

const pending = ref(true)
const error = ref<string | null>(null)
const allProducts = ref<Product[]>([])
const brandOptions = ref<string[]>([])
const categoryOptions = ref<string[]>([])
const currentPage = ref(0)
const headlineWord = ref('Gifts')
const headlineSearchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const normalizeSearchPrice = (value: SearchHit['price']) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normalizeSearchProduct = (hit: SearchHit, index: number): Product => {
  const id = hit.id ?? `search-${index}`
  const name = hit.name?.trim() || `Product ${index + 1}`
  const sku = typeof hit.sku === 'string' || typeof hit.sku === 'number' ? String(hit.sku).trim() : ''
  const categories = Array.isArray(hit.categories_ids)
    ? hit.categories_ids.map((entry) => entry?.trim()).filter((entry): entry is string => Boolean(entry))
    : []
  const primaryCategory = categories[0] || hit.category_id?.trim() || 'Search'
  const price = normalizeSearchPrice(hit.price)
  return {
    id,
    slug: String(id),
    name,
    title: name,
    description: hit.description?.trim() || '',
    price,
    category: primaryCategory,
    image: hit.img_link?.trim() || SEARCH_PLACEHOLDER_IMAGE,
    rating: 4.7,
    highlights: ['Editor pick', 'Great for gifting'],
    inStock: true,
    colors: [],
    sizes: ['One Size'],
    sku: sku || undefined,
    brand: hit.brand?.trim() || undefined,
    vendor: hit.vendor?.trim() || undefined,
    categoryIds: categories.length ? categories : undefined,
    link: hit.link?.trim() || `/products/${id}`
  }
}

const products = computed(() => allProducts.value)

const selectedCategories = ref<string[]>([])
const selectedBrands = ref<string[]>([])
const priceMin = ref<number | null>(null)
const priceMax = ref<number | null>(null)
const sortOption = ref<SortOption>('featured')
const giftSearch = ref('')
const categorySearch = ref('')
const brandSearch = ref('')
const isFilterDrawerOpen = ref(false)
const autocompleteSuggestions = ref<string[]>([])
const isAutocompleteLoading = ref(false)

const showBrandSearch = computed(() => brandOptions.value.length > 10)
const showCategorySearch = computed(() => categoryOptions.value.length > 10)

const filteredCategoryOptions = computed(() => {
  if (!showCategorySearch.value || !categorySearch.value.trim()) {
    return categoryOptions.value
  }
  const query = categorySearch.value.toLowerCase()
  return categoryOptions.value.filter((category) => category.toLowerCase().includes(query))
})

const filteredBrandOptions = computed(() => {
  if (!showBrandSearch.value || !brandSearch.value.trim()) {
    return brandOptions.value
  }
  const query = brandSearch.value.toLowerCase()
  return brandOptions.value.filter((brand) => brand.toLowerCase().includes(query))
})

const categorySuggestions = computed(() => {
  const source = giftSearchNormalized.value ? filteredProducts.value : products.value
  const unique = new Set<string>()
  for (const product of source) {
    for (const entry of extractCategories(product)) {
      unique.add(entry)
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b))
})

const giftSuggestionChips = computed(() => {
  if (autocompleteSuggestions.value.length) {
    return autocompleteSuggestions.value
  }
  return categorySuggestions.value.slice(0, 8)
})

const normalizeGiftQuery = (value: string) =>
  value.replace(/^gift\s+/i, '').trim()

const giftSearchNormalized = computed(() => normalizeGiftQuery(giftSearch.value))

const priceBounds = computed(() => {
  const prices = products.value.map((product) => product.price).filter(Number.isFinite)
  if (!prices.length) {
    return { min: PRICE_FALLBACK_MIN, max: PRICE_FALLBACK_MAX }
  }
  return {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices))
  }
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const normalizePriceValue = (value: string | number | null) => {
  if (value === '' || value === null) return null
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const setPriceMin = (value: number | null) => {
  if (value === null) {
    priceMin.value = null
    return
  }
  const bounds = priceBounds.value
  const clamped = Math.max(bounds.min, Math.min(value, bounds.max))
  const maxValue = priceMax.value ?? bounds.max
  priceMin.value = Math.min(clamped, maxValue)
}

const setPriceMax = (value: number | null) => {
  if (value === null) {
    priceMax.value = null
    return
  }
  const bounds = priceBounds.value
  const clamped = Math.max(bounds.min, Math.min(value, bounds.max))
  const minValue = priceMin.value ?? bounds.min
  priceMax.value = Math.max(clamped, minValue)
}

const minPriceInput = computed({
  get: () => (priceMin.value ?? '').toString(),
  set: (value: string) => setPriceMin(normalizePriceValue(value))
})

const maxPriceInput = computed({
  get: () => (priceMax.value ?? '').toString(),
  set: (value: string) => setPriceMax(normalizePriceValue(value))
})

const sliderMinValue = computed(() => priceMin.value ?? priceBounds.value.min)
const sliderMaxValue = computed(() => priceMax.value ?? priceBounds.value.max)

const priceFillStyle = computed(() => {
  const bounds = priceBounds.value
  const span = bounds.max - bounds.min || 1
  const left = ((sliderMinValue.value - bounds.min) / span) * 100
  const right = ((bounds.max - sliderMaxValue.value) / span) * 100
  return {
    left: `${Math.max(0, Math.min(left, 100))}%`,
    right: `${Math.max(0, Math.min(right, 100))}%`
  }
})

const normalizeToken = (value: string) => value.toLowerCase().trim()

const extractCategories = (product: Product) => {
  const categories = [
    ...(product.categoryIds ?? []),
    product.category,
    product.category_level2,
    product.category_level3,
    product.category_level4
  ]
  return categories.map((entry) => entry?.trim()).filter((entry): entry is string => Boolean(entry))
}

const matchesSelectedCategories = (product: Product) => {
  if (!selectedCategories.value.length) return true
  const selected = new Set(selectedCategories.value.map(normalizeToken))
  const productCategories = extractCategories(product).map(normalizeToken)
  return productCategories.some((category) => selected.has(category))
}

const matchesSelectedBrands = (product: Product) => {
  if (!selectedBrands.value.length) return true
  const selected = new Set(selectedBrands.value.map(normalizeToken))
  const brand = product.brand ? normalizeToken(product.brand) : ''
  return brand ? selected.has(brand) : false
}

const matchesPriceRange = (product: Product) => {
  const min = priceMin.value
  const max = priceMax.value
  if (min !== null && product.price < min) return false
  if (max !== null && product.price > max) return false
  return true
}

const matchesGiftQuery = (product: Product) => {
  const term = giftSearchNormalized.value.toLowerCase()
  if (!term) return true
  const haystack = [
    product.name,
    product.brand,
    product.category,
    product.category_level2,
    product.category_level3,
    product.category_level4,
    ...(product.categoryIds ?? []),
    product.description
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(term)
}

const filteredProducts = computed(() =>
  products.value.filter(
    (product) =>
      matchesSelectedCategories(product)
      && matchesSelectedBrands(product)
      && matchesPriceRange(product)
      && matchesGiftQuery(product)
  )
)

const sortedProducts = computed(() => {
  const items = [...filteredProducts.value]
  if (sortOption.value === 'price-asc') {
    return items.sort((a, b) => a.price - b.price)
  }
  if (sortOption.value === 'price-desc') {
    return items.sort((a, b) => b.price - a.price)
  }
  return items
})

const totalHits = computed(() => filteredProducts.value.length)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProducts.value.length / ITEMS_PER_BATCH))
)
const visibleProducts = computed(() =>
  sortedProducts.value.slice(0, (currentPage.value + 1) * ITEMS_PER_BATCH)
)
const canLoadMore = computed(() => currentPage.value + 1 < totalPages.value)

const hasActiveFilters = computed(
  () =>
    Boolean(giftSearchNormalized.value)
    || selectedCategories.value.length > 0
    || selectedBrands.value.length > 0
    || priceMin.value !== null
    || priceMax.value !== null
    || sortOption.value !== 'featured'
)

const toggleCategory = (category: string) => {
  const next = new Set(selectedCategories.value)
  if (next.has(category)) {
    next.delete(category)
  } else {
    next.add(category)
  }
  selectedCategories.value = Array.from(next)
}

const toggleBrand = (brand: string) => {
  const next = new Set(selectedBrands.value)
  if (next.has(brand)) {
    next.delete(brand)
  } else {
    next.add(brand)
  }
  selectedBrands.value = Array.from(next)
}

const clearBrands = () => {
  selectedBrands.value = []
}

const clearCategories = () => {
  selectedCategories.value = []
}

const clearPrice = () => {
  priceMin.value = null
  priceMax.value = null
}

const clearAll = () => {
  clearGiftSearch()
  clearCategories()
  clearBrands()
  clearPrice()
  sortOption.value = 'featured'
}

const handleMinPriceInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  setPriceMin(Number.isFinite(value) ? value : null)
}

const handleMaxPriceInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  setPriceMax(Number.isFinite(value) ? value : null)
}

const openFilterDrawer = () => {
  isFilterDrawerOpen.value = true
}

const handleRetry = () => {
  void fetchValentinesProducts()
}

const closeFilterDrawer = () => {
  isFilterDrawerOpen.value = false
}

const scrollToProducts = () => {
  if (!import.meta.client) return
  const target = document.getElementById('valentines-products')
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const loadMore = () => {
  if (!canLoadMore.value || pending.value) return
  currentPage.value += 1
}

const parseList = (value: string | Array<string | null | undefined> | null | undefined) => {
  if (!value) return []
  const raw = Array.isArray(value) ? value.filter((entry) => entry !== null && entry !== undefined).join(',') : value
  return raw
    .split(',')
    .map((entry) => decodeURIComponent(entry).trim())
    .filter(Boolean)
}

const parseNumber = (value: string | Array<string | null | undefined> | null | undefined) => {
  const raw = Array.isArray(value)
    ? value.find((entry) => entry !== null && entry !== undefined)
    : value
  if (!raw) return null
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : null
}

const parseString = (value: string | Array<string | null | undefined> | null | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : ''
}

const isSortOption = (value: string | undefined): value is SortOption => {
  return value === 'featured' || value === 'price-asc' || value === 'price-desc'
}

let syncingFromRoute = false
let searchTimeout: ReturnType<typeof setTimeout> | null = null
let lastSearchKey = ''
let autocompleteTimeout: ReturnType<typeof setTimeout> | null = null
let autocompleteRequestId = 0

const updateBrandOptions = (items: Product[]) => {
  const brandsFromProducts = Array.from(
    new Set(
      items
        .map((product) => product.brand?.trim())
        .filter((brand): brand is string => Boolean(brand))
    )
  )

  const selected = selectedBrands.value
  const merged = new Set(brandsFromProducts)
  for (const brand of selected) {
    merged.add(brand)
  }
  brandOptions.value = Array.from(merged).sort((a, b) => a.localeCompare(b))
}

const updateCategoryOptions = (items: Product[]) => {
  const categoriesFromProducts = new Set<string>()
  for (const product of items) {
    for (const entry of extractCategories(product)) {
      categoriesFromProducts.add(entry)
    }
  }

  const selected = selectedCategories.value
  const merged = new Set(categoriesFromProducts)
  for (const category of selected) {
    merged.add(category)
  }
  categoryOptions.value = Array.from(merged).sort((a, b) => a.localeCompare(b))
}

const fetchValentinesProducts = async () => {
  pending.value = true
  error.value = null

  try {
    const query = headlineWord.value.trim()
    let items: Product[] = []
    if (query) {
      const data = await $fetch<SearchResponse>(SEARCH_ENDPOINT, {
        query: { text: query, hitsPerPage: String(SEARCH_HITS_PER_PAGE) }
      })
      const hits = data.hits ?? []
      items = hits.map(normalizeSearchProduct)
    } else {
      const data = await $fetch<SearchResponse>(SEARCH_ENDPOINT, {
        query: {
          wildcard: 'true',
          vendor: 'ME EM',
          hitsPerPage: String(SEARCH_HITS_PER_PAGE),
          page: '0'
        }
      })
      const hits = data.hits ?? []
      items = hits.map(normalizeSearchProduct)
    }
    allProducts.value = items
    updateBrandOptions(items)
    updateCategoryOptions(items)
  } catch (fetchError) {
    console.error('Failed to load Valentines products', fetchError)
    error.value = 'We were unable to load products right now.'
    allProducts.value = []
    brandOptions.value = []
    categoryOptions.value = []
  } finally {
    pending.value = false
  }
}

const ensureProductsLoaded = async () => {
  if (allProducts.value.length || pending.value) return
  await fetchValentinesProducts()
}

const scheduleSearch = () => {
  if (!import.meta.client) {
    void ensureProductsLoaded()
    return
  }
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
  searchTimeout = setTimeout(() => {
    void ensureProductsLoaded()
  }, 250)
}

const scheduleHeadlineSearch = () => {
  if (headlineSearchTimeout.value) {
    clearTimeout(headlineSearchTimeout.value)
    headlineSearchTimeout.value = null
  }
  headlineSearchTimeout.value = setTimeout(() => {
    void fetchValentinesProducts()
  }, 300)
}

const buildAutocompleteSuggestions = (input: string) => {
  const normalized = normalizeGiftQuery(input).toLowerCase()
  const suggestions: string[] = []
  const seen = new Set<string>()
  const addSuggestion = (value?: string) => {
    const trimmed = value?.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (seen.has(key)) return
    if (normalized && !key.includes(normalized)) return
    seen.add(key)
    suggestions.push(trimmed)
  }

  for (const product of allProducts.value) {
    addSuggestion(product.brand)
    addSuggestion(product.category)
    addSuggestion(product.category_level2)
    addSuggestion(product.category_level3)
    addSuggestion(product.category_level4)
    if (product.categoryIds) {
      for (const entry of product.categoryIds) {
        addSuggestion(entry)
      }
    }
    if (suggestions.length >= 8) break
  }

  return suggestions.slice(0, 6)
}

const performAutocomplete = async (input: string) => {
  const trimmed = input.trim()
  const requestId = ++autocompleteRequestId

  if (!import.meta.client) {
    autocompleteSuggestions.value = []
    isAutocompleteLoading.value = false
    return
  }

  isAutocompleteLoading.value = true

  try {
    const suggestions = buildAutocompleteSuggestions(trimmed)

    if (requestId !== autocompleteRequestId) {
      return
    }

    autocompleteSuggestions.value = suggestions
  } catch (fetchError) {
    if (requestId !== autocompleteRequestId) {
      return
    }
    console.error('Failed to fetch gift autocomplete', fetchError)
    autocompleteSuggestions.value = []
  } finally {
    if (requestId === autocompleteRequestId) {
      isAutocompleteLoading.value = false
    }
  }
}

const scheduleAutocomplete = (query: string) => {
  if (!import.meta.client) return
  if (autocompleteTimeout) {
    clearTimeout(autocompleteTimeout)
    autocompleteTimeout = null
  }
  autocompleteTimeout = setTimeout(() => {
    void performAutocomplete(query)
  }, 250)
}

const applySuggestion = (suggestion: string) => {
  const normalized = normalizeGiftQuery(suggestion)
  giftSearch.value = normalized
  autocompleteSuggestions.value = []
}

const clearGiftSearch = () => {
  giftSearch.value = ''
  autocompleteSuggestions.value = []
}

const buildSearchKey = () => {
  const categories = [...selectedCategories.value].sort().join('|')
  const brands = [...selectedBrands.value].sort().join('|')
  const term = giftSearchNormalized.value
  const min = priceMin.value !== null ? String(priceMin.value) : ''
  const max = priceMax.value !== null ? String(priceMax.value) : ''
  return `${categories}:${brands}:${term}:${min}:${max}`
}

const syncStateFromQuery = async () => {
  syncingFromRoute = true
  giftSearch.value = parseString(route.query.giftQuery)
  selectedCategories.value = parseList(route.query.category)
  selectedBrands.value = parseList(route.query.brand)
  priceMin.value = parseNumber(route.query.minPrice)
  priceMax.value = parseNumber(route.query.maxPrice)
  const sortValueRaw = Array.isArray(route.query.sort) ? route.query.sort[0] : route.query.sort
  const sortValue = sortValueRaw ?? undefined
  sortOption.value = isSortOption(sortValue) ? sortValue : 'featured'
  await nextTick()
  syncingFromRoute = false
  const nextKey = buildSearchKey()
  if (nextKey !== lastSearchKey) {
    lastSearchKey = nextKey
    scheduleSearch()
  }
}

void syncStateFromQuery()
if (import.meta.client) {
  void performAutocomplete('')
}

watch(giftSearch, (value) => {
  const term = normalizeGiftQuery(value)
  if (!term) {
    void performAutocomplete('')
    return
  }
  autocompleteSuggestions.value = []
})

watch(headlineWord, () => {
  const value = headlineWord.value.trim()
  if (!value) {
    scheduleHeadlineSearch()
    return
  }
  const capitalized = value.charAt(0).toUpperCase() + value.slice(1)
  if (capitalized !== headlineWord.value) {
    headlineWord.value = capitalized
  }
  scheduleHeadlineSearch()
})

const queryState = computed(() => ({
  giftQuery: giftSearchNormalized.value ? giftSearchNormalized.value : undefined,
  category: selectedCategories.value.length ? selectedCategories.value.join(',') : undefined,
  brand: selectedBrands.value.length ? selectedBrands.value.join(',') : undefined,
  minPrice: priceMin.value !== null ? String(priceMin.value) : undefined,
  maxPrice: priceMax.value !== null ? String(priceMax.value) : undefined,
  sort: sortOption.value !== 'featured' ? sortOption.value : undefined
}))

watch(() => route.query, syncStateFromQuery)

watch(queryState, (next) => {
  if (syncingFromRoute) return
  const cleaned = Object.fromEntries(
    Object.entries(next).filter(([, value]) => value !== undefined)
  )
  router.replace({ query: cleaned })
}, { deep: true })

watch(
  () => JSON.stringify(queryState.value),
  () => {
    currentPage.value = 0
    lastSearchKey = ''
  }
)

watch(priceBounds, (bounds) => {
  if (priceMin.value !== null) {
    setPriceMin(priceMin.value)
  }
  if (priceMax.value !== null) {
    setPriceMax(priceMax.value)
  }
})

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
  if (autocompleteTimeout) {
    clearTimeout(autocompleteTimeout)
    autocompleteTimeout = null
  }
  if (headlineSearchTimeout.value) {
    clearTimeout(headlineSearchTimeout.value)
    headlineSearchTimeout.value = null
  }
})
</script>

<style scoped>
.range-input {
  appearance: none;
  background: transparent;
}
.range-input::-webkit-slider-runnable-track {
  height: 0.5rem;
  background: transparent;
}
.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  background: #0f172a;
  border: 2px solid #fff;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.15);
  margin-top: -5px;
}
.range-input::-moz-range-track {
  height: 0.5rem;
  background: transparent;
}
.range-input::-moz-range-thumb {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  background: #0f172a;
  border: 2px solid #fff;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.15);
}
</style>

<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <div class="rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 p-6 shadow-sm ring-1 ring-rose-100 sm:p-10">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">Seasonal edit</p>
            <h1 class="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Valentines Day Gifts</h1>
            <p class="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Thoughtful picks with heart-forward details, curated for cozy nights, elegant surprises, and everyday romance.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              @click="scrollToProducts"
            >
              Shop gifts
            </button>
            <button
              type="button"
              class="rounded-full border border-rose-200 bg-white/70 px-6 py-3 text-sm font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
              @click="clearAll"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

    </section>

    <div class="lg:grid lg:grid-cols-[280px,1fr] lg:items-start lg:gap-8">
      <aside class="hidden lg:block">
        <div class="sticky top-32 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</p>
            <button
              v-if="hasActiveFilters"
              type="button"
              class="text-xs font-semibold text-primary-600 hover:text-primary-500"
              @click="clearAll"
            >
              Clear
            </button>
          </div>
          <p class="mt-1 text-xs text-slate-500">Showing {{ filteredProducts.length }} gifts</p>

          <div class="mt-5 space-y-6">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
                <button
                  v-if="selectedCategories.length"
                  type="button"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                  @click="clearCategories"
                >
                  Reset
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  :class="categoryChipClass(selectedCategories.length === 0)"
                  @click="clearCategories"
                >
                  All
                </button>
                <button
                  v-for="category in categoryOptions"
                  :key="category"
                  type="button"
                  :class="categoryChipClass(selectedCategories.includes(category))"
                  @click="toggleCategory(category)"
                >
                  {{ category }}
                </button>
              </div>
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
          </div>
        </div>
      </aside>

      <div class="space-y-6">
        <div class="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur lg:hidden">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-slate-900">Filter the collection</p>
              <p class="text-xs text-slate-500">Showing {{ filteredProducts.length }} gifts</p>
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
          <div v-if="pending" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

          <div v-else-if="!visibleProducts.length" class="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900">No gifts match your filters.</h2>
            <p class="mt-2 text-sm text-slate-500">Try widening your filters or reset to see all curated items.</p>
            <button
              type="button"
              class="mt-4 rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary-500"
              @click="clearAll"
            >
              Clear filters
            </button>
          </div>

          <div v-else class="space-y-8">
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
                :disabled="!canLoadMore"
                @click="loadMore"
              >
                {{ canLoadMore ? 'Load more gifts' : 'All gifts loaded' }}
              </button>
              <p class="ml-auto">
                Showing <span class="font-semibold text-slate-900">{{ visibleProducts.length }}</span> of
                <span class="font-semibold text-slate-900">{{ filteredProducts.length }}</span>
              </p>
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
            <p class="text-sm font-semibold text-slate-900">Filters</p>
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
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
                <button
                  v-if="selectedCategories.length"
                  type="button"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                  @click="clearCategories"
                >
                  Reset
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  :class="categoryChipClass(selectedCategories.length === 0)"
                  @click="clearCategories"
                >
                  All
                </button>
                <button
                  v-for="category in categoryOptions"
                  :key="category"
                  type="button"
                  :class="categoryChipClass(selectedCategories.includes(category))"
                  @click="toggleCategory(category)"
                >
                  {{ category }}
                </button>
              </div>
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
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'

import type { Product } from '@/types/product'
import ValentinesProductCard from '@/components/ValentinesProductCard.vue'

type SortOption = 'featured' | 'price-asc' | 'price-desc'

const PRICE_SLIDER_STEP = 1
const ITEMS_PER_BATCH = 12

const route = useRoute()
const router = useRouter()

const { data, pending, error, refresh } = await useAsyncData<{ products: Product[]; fetchedAt: number }>(
  'valentines-products',
  () => $fetch('/api/valentines-products'),
  { server: true }
)

const products = computed(() => data.value?.products ?? [])

const selectedCategories = ref<string[]>([])
const selectedBrands = ref<string[]>([])
const priceMin = ref<number | null>(null)
const priceMax = ref<number | null>(null)
const sortOption = ref<SortOption>('featured')
const brandSearch = ref('')
const visibleCount = ref(ITEMS_PER_BATCH)
const isFilterDrawerOpen = ref(false)

const categoryOptions = computed(() => {
  const unique = new Map<string, string>()
  for (const product of products.value) {
    const category = product.category?.trim()
    if (!category) continue
    const key = category.toLowerCase()
    if (!unique.has(key)) {
      unique.set(key, category)
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b))
})

const brandOptions = computed(() => {
  const unique = new Map<string, string>()
  for (const product of products.value) {
    const brand = product.brand?.trim()
    if (!brand) continue
    const key = brand.toLowerCase()
    if (!unique.has(key)) {
      unique.set(key, brand)
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b))
})

const showBrandSearch = computed(() => brandOptions.value.length > 10)

const filteredBrandOptions = computed(() => {
  if (!showBrandSearch.value || !brandSearch.value.trim()) {
    return brandOptions.value
  }
  const query = brandSearch.value.toLowerCase()
  return brandOptions.value.filter((brand) => brand.toLowerCase().includes(query))
})

const priceBounds = computed(() => {
  const prices = products.value.map((product) => product.price).filter(Number.isFinite)
  if (!prices.length) {
    return { min: 0, max: 0 }
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

const filteredProducts = computed(() => {
  const categories = selectedCategories.value.map((category) => category.toLowerCase())
  const brands = selectedBrands.value.map((brand) => brand.toLowerCase())
  return products.value.filter((product) => {
    if (categories.length > 0) {
      const category = product.category?.toLowerCase() || ''
      if (!categories.includes(category)) return false
    }
    if (brands.length > 0) {
      const brand = product.brand?.toLowerCase() || ''
      if (!brands.includes(brand)) return false
    }
    if (priceMin.value !== null && product.price < priceMin.value) return false
    if (priceMax.value !== null && product.price > priceMax.value) return false
    return true
  })
})

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

const visibleProducts = computed(() => sortedProducts.value.slice(0, visibleCount.value))
const canLoadMore = computed(() => visibleCount.value < sortedProducts.value.length)

const hasActiveFilters = computed(
  () =>
    selectedCategories.value.length > 0
    || selectedBrands.value.length > 0
    || priceMin.value !== null
    || priceMax.value !== null
    || sortOption.value !== 'featured'
)

const categoryChipClass = (active: boolean) =>
  [
    'rounded-full border px-4 py-2 text-xs font-semibold transition',
    active ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600'
  ].join(' ')

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

const clearCategories = () => {
  selectedCategories.value = []
}

const clearBrands = () => {
  selectedBrands.value = []
}

const clearPrice = () => {
  priceMin.value = null
  priceMax.value = null
}

const clearAll = () => {
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
  void refresh()
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
  visibleCount.value = Math.min(
    visibleCount.value + ITEMS_PER_BATCH,
    sortedProducts.value.length
  )
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

const isSortOption = (value: string | undefined): value is SortOption => {
  return value === 'featured' || value === 'price-asc' || value === 'price-desc'
}

let syncingFromRoute = false

const syncStateFromQuery = async () => {
  syncingFromRoute = true
  selectedCategories.value = parseList(route.query.category)
  selectedBrands.value = parseList(route.query.brand)
  priceMin.value = parseNumber(route.query.minPrice)
  priceMax.value = parseNumber(route.query.maxPrice)
  const sortValueRaw = Array.isArray(route.query.sort) ? route.query.sort[0] : route.query.sort
  const sortValue = sortValueRaw ?? undefined
  sortOption.value = isSortOption(sortValue) ? sortValue : 'featured'
  await nextTick()
  syncingFromRoute = false
}

void syncStateFromQuery()

const queryState = computed(() => ({
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
    visibleCount.value = ITEMS_PER_BATCH
  }
)

watch(priceBounds, (bounds) => {
  if (priceMin.value !== null) {
    setPriceMin(priceMin.value)
  }
  if (priceMax.value !== null) {
    setPriceMax(priceMax.value)
  }
  if (bounds.min === bounds.max) {
    priceMin.value = null
    priceMax.value = null
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

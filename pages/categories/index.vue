<template>
  <div class="space-y-16">
    <section class="rounded-3xl bg-white p-10 shadow-xl ring-1 ring-slate-100">
      <div class="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.25em] text-primary-500">Shop by category</p>
          <h1 class="mt-4 text-4xl font-semibold text-slate-900">Explore collections by mood and use-case</h1>
          <p class="mt-2 text-base text-slate-600">
            Scroll through the same grid experience as the Brands page, but filter by product categories to zero-in on what you need faster.
          </p>
          <label class="mt-5 flex max-w-sm flex-col gap-2 text-sm text-slate-600">
            <span class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Filter by brand</span>
            <select
              :value="selectedBrand"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              @change="onSelectBrand(($event.target as HTMLSelectElement).value)"
            >
              <option value="All">All brands</option>
              <option v-for="brand in brands" :key="brand" :value="brand">
                {{ formatBrandLabel(brand) }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </section>
    <ProductGrid
      v-if="vendorCookieReady"
      :products="products"
      :loading="loading"
      :error="error"
      :brands="categories"
      :selected-brand="selectedCategory"
      :search-query="searchQuery"
      :enable-search="false"
      :enable-pagination="false"
      :enable-load-more="true"
      :can-load-more="canLoadMore"
      recommendation-filter-field="category"
      @select-brand="onSelectCategory"
      @search="onSearch"
      @load-more="onLoadMore"
      @view-details="onViewDetails"
    >
      <template #between-recommendations>
        <div
          v-if="storedAffinities.length"
          class="!mt-0 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-amber-50/60 p-6 shadow-sm"
        >
          <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p class="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
              <span class="h-2 w-2 rounded-full bg-amber-400"></span>
              Affinities
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition"
                :class="affinityScope === 'all_time'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                  : 'border-emerald-200/70 bg-emerald-50/40 text-emerald-700/80 hover:border-emerald-300/70 hover:text-emerald-700'"
                :aria-label="`Switch affinity scope (currently ${affinityScope === 'all_time' ? 'all times interest' : 'session interest'})`"
                @click="affinityScope = affinityScope === 'all_time' ? 'session' : 'all_time'"
              >
                {{ affinityScope === 'all_time' ? 'All times interest' : 'Session interest' }}
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-primary-300 hover:text-primary-600"
                @click="clearAffinities"
              >
                Clear
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-3 pb-4">
            <button
              v-for="affinity in storedAffinities"
              :key="`${affinity.category ?? 'all'}-${affinity.brand ?? 'all'}`"
              type="button"
              class="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600 hover:shadow-md"
              @click="applyStoredAffinity(affinity)"
            >
              <span>{{ affinity.category || affinity.brand }}</span>
            </button>
          </div>
        </div>
      </template>
    </ProductGrid>
    <div v-else class="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
      Loading your catalog…
    </div>
    <NewsletterBanner />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Product } from '@/types/product'
import NewsletterBanner from '@/components/NewsletterBanner.vue'
import ProductGrid from '@/components/ProductGrid.vue'

type StoredAffinity = {
  category: string | null
  brand: string | null
}

type StoredFilters = {
  affinities: StoredAffinity[]
}

const STORED_FILTERS_KEY = 'category-filter-history'
const SESSION_FILTERS_KEY = 'category-filter-session'
const AFFINITY_SCOPE_KEY = 'category-affinity-scope'
const affinityScope = ref<'session' | 'all_time'>('session')
const storedAffinities = ref<StoredAffinity[]>([])
const VENDOR_COOKIE_NAME = 'abt_vendor'
const vendorCookieReady = ref(false)

const readCookie = (name: string) => {
  if (!import.meta.client || !document?.cookie) return ''
  const prefix = `${name}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length)).trim()
    }
  }
  return ''
}

const persistSelections = (product?: Product) => {
  const category =
    selectedCategory.value && selectedCategory.value !== 'All'
      ? selectedCategory.value
      : product?.category?.trim() || null
  const brand =
    selectedBrand.value && selectedBrand.value !== 'All'
      ? selectedBrand.value
      : product?.brand?.trim() || null

  if (!category && !brand) {
    return
  }

  const next = [...storedAffinities.value]
  const exists = next.some((entry) => entry.category === category && entry.brand === brand)
  if (!exists) {
    next.unshift({ category, brand })
  }

  storedAffinities.value = next.slice(0, 12)

  if (!import.meta.client) return
  sessionStorage.setItem(SESSION_FILTERS_KEY, JSON.stringify({ affinities: storedAffinities.value }))
  if (affinityScope.value === 'all_time') {
    localStorage.setItem(STORED_FILTERS_KEY, JSON.stringify({ affinities: storedAffinities.value }))
  }
}

const {
  products,
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  searchQuery,
  loading,
  error,
  fetchProducts,
  selectCategory,
  selectBrand,
  applyAffinity,
  searchProducts,
  canLoadMore,
  loadMore
} = useCategoryProducts()

await fetchProducts()

onMounted(() => {
  const existingVendor = readCookie(VENDOR_COOKIE_NAME)
  if (existingVendor) {
    vendorCookieReady.value = true
  } else {
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const value = readCookie(VENDOR_COOKIE_NAME)
      const timedOut = Date.now() - startedAt > 1500
      if (value || timedOut) {
        vendorCookieReady.value = true
        window.clearInterval(timer)
      }
    }, 50)
  }

  try {
    const savedScope = sessionStorage.getItem(AFFINITY_SCOPE_KEY)
    affinityScope.value = savedScope === 'all_time' ? 'all_time' : 'session'
  } catch {
    affinityScope.value = 'session'
  }

  const loadAffinities = (raw: string | null) => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as StoredFilters & {
        categories?: string[]
        brands?: string[]
      }
      if (Array.isArray(parsed?.affinities)) {
        return parsed.affinities
      }
      const categories = Array.isArray(parsed?.categories) ? parsed.categories : []
      const brands = Array.isArray(parsed?.brands) ? parsed.brands : []
      return [
        ...categories.map((category) => ({ category, brand: null })),
        ...brands.map((brand) => ({ category: null, brand }))
      ]
    } catch {
      return []
    }
  }

  const sessionRaw = sessionStorage.getItem(SESSION_FILTERS_KEY)
  const allTimeRaw = localStorage.getItem(STORED_FILTERS_KEY)
  storedAffinities.value =
    affinityScope.value === 'all_time' ? loadAffinities(allTimeRaw) : loadAffinities(sessionRaw)
})

watch(affinityScope, (next) => {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(AFFINITY_SCOPE_KEY, next)
  } catch {
    // no-op
  }
  const sessionRaw = sessionStorage.getItem(SESSION_FILTERS_KEY)
  const allTimeRaw = localStorage.getItem(STORED_FILTERS_KEY)
  const raw = next === 'all_time' ? allTimeRaw : sessionRaw
  if (!raw) {
    storedAffinities.value = []
    return
  }
  try {
    const parsed = JSON.parse(raw) as StoredFilters & { affinities?: StoredAffinity[] }
    storedAffinities.value = Array.isArray(parsed?.affinities) ? parsed.affinities : []
  } catch {
    storedAffinities.value = []
  }
})

const onSelectCategory = (category: string) => {
  selectCategory(category)
}

const onSelectBrand = (brand: string) => {
  selectBrand(brand)
}

const applyStoredAffinity = (affinity: StoredAffinity) => {
  void applyAffinity(affinity.category, affinity.brand)
}

const onViewDetails = (product: Product) => {
  persistSelections(product)
}

const clearAffinities = () => {
  storedAffinities.value = []
  if (!import.meta.client) return
  if (affinityScope.value === 'all_time') {
    localStorage.removeItem(STORED_FILTERS_KEY)
  } else {
    sessionStorage.removeItem(SESSION_FILTERS_KEY)
  }
}

const formatBrandLabel = (brand: string) => brand.trim().toUpperCase()

const onSearch = async (query: string) => {
  await searchProducts(query)
}

const onLoadMore = async () => {
  await loadMore()
}
</script>

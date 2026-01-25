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
                {{ brand }}
              </option>
            </select>
          </label>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          <div
            v-if="storedAffinities.length"
            class="text-sm text-slate-600"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Affinities</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="affinity in storedAffinities"
                :key="`${affinity.category ?? 'all'}-${affinity.brand ?? 'all'}`"
                type="button"
                class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-400 hover:text-primary-600"
                @click="applyStoredAffinity(affinity)"
              >
                <span v-if="affinity.category">{{ affinity.category }}</span>
                <span v-if="affinity.category && affinity.brand"> · </span>
                <span v-if="affinity.brand">{{ affinity.brand }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <ProductGrid
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
    />
    <NewsletterBanner />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
const storedAffinities = ref<StoredAffinity[]>([])

const persistSelections = () => {
  const category =
    selectedCategory.value && selectedCategory.value !== 'All' ? selectedCategory.value : null
  const brand = selectedBrand.value && selectedBrand.value !== 'All' ? selectedBrand.value : null

  if (!category && !brand) {
    return
  }

  const next = [...storedAffinities.value]
  const exists = next.some((entry) => entry.category === category && entry.brand === brand)
  if (!exists) {
    next.unshift({ category, brand })
  }

  storedAffinities.value = next.slice(0, 12)
  localStorage.setItem(STORED_FILTERS_KEY, JSON.stringify({ affinities: storedAffinities.value }))
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
  searchProducts,
  canLoadMore,
  loadMore
} = useCategoryProducts()

await fetchProducts()

onMounted(() => {
  const raw = localStorage.getItem(STORED_FILTERS_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as StoredFilters & {
      categories?: string[]
      brands?: string[]
    }
    if (Array.isArray(parsed?.affinities)) {
      storedAffinities.value = parsed.affinities
    } else {
      const categories = Array.isArray(parsed?.categories) ? parsed.categories : []
      const brands = Array.isArray(parsed?.brands) ? parsed.brands : []
      storedAffinities.value = [
        ...categories.map((category) => ({ category, brand: null })),
        ...brands.map((brand) => ({ category: null, brand }))
      ]
    }
  } catch {
    storedAffinities.value = []
  }
})

const onSelectCategory = (category: string) => {
  selectCategory(category)
  persistSelections()
}

const onSelectBrand = (brand: string) => {
  selectBrand(brand)
  persistSelections()
}

const applyStoredAffinity = (affinity: StoredAffinity) => {
  if (affinity.category) {
    selectCategory(affinity.category)
  }
  if (affinity.brand) {
    selectBrand(affinity.brand)
  }
  persistSelections()
}

const onSearch = async (query: string) => {
  await searchProducts(query)
}

const onLoadMore = async () => {
  await loadMore()
}
</script>

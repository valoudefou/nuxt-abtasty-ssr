<template>
<section id="products" class="mt-20 space-y-8">
    <RecommendationsCarousel :filter-field="recommendationFilterField ?? 'brand'" :filter-value="recommendationFilterValue" />
    <slot name="between-recommendations" />
    <div class="flex flex-row flex-wrap items-start justify-between gap-6 sm:items-center">
      <div>
        <h2 class="section-title">Featured products</h2>
        <p class="section-subtitle">
          Hand-curated essentials crafted with precision detail and premium sustainable fabrics.
        </p>
      </div>
      <div class="max-w-full overflow-x-auto">
        <div class="flex items-center gap-3 whitespace-nowrap text-sm min-w-[720px]">
          <div class="flex-row-reverse sticky left-0 z-10 flex items-center gap-3 bg-[#f9fafc]">
            <button
              type="button"
              :aria-pressed="selectedBrand === 'All'"
              class="rounded-full border px-4 py-2 text-sm font-medium transition"
              :class="
                selectedBrand === 'All'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600'
              "
              @click="emit('select-brand', 'All')"
            >
              All
            </button>
            <label v-if="enableSearch" class="relative">
              <span class="sr-only">Search products</span>
              <input
                :value="searchQuery"
                type="search"
                name="product-search"
                placeholder="Search products"
                class="w-48 min-w-[10rem] rounded-full border border-slate-200 px-4 py-2 text-sm shadow-sm outline-none transition focus:border-primary-500 focus:ring-primary-200"
                @input="onSearchInput"
              />
            </label>
          </div>
          <div class="flex flex-1 items-center gap-3">
            <button
              v-for="filter in filteredFilters"
              :key="filter"
              type="button"
              :aria-pressed="selectedBrand === filter"
              class="rounded-full border px-4 py-2 text-sm font-medium transition"
              :class="
                selectedBrand === filter
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600'
              "
              @click="emit('select-brand', filter)"
            >
              {{ filter }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>

    <p v-if="error" class="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">{{ error }}</p>

    <div
      v-if="enablePagination && totalPages > 1"
      class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm"
    >
      <p>
        Page <span class="font-semibold text-slate-900">{{ currentPage }}</span> of
        <span class="font-semibold text-slate-900">{{ totalPages }}</span>
      </p>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="currentPage <= 1"
          @click="emit('page-change', currentPage - 1)"
        >
          Previous
        </button>
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="currentPage >= totalPages"
          @click="emit('page-change', currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <div
      v-if="enableLoadMore"
      class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm"
    >
      <p v-if="!canLoadMore && !loading" class="font-medium text-slate-500">You're all caught up.</p>
      <button
        v-else
        type="button"
        class="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="loading || !canLoadMore"
        @click="emit('load-more')"
      >
        {{ loading ? 'Loading...' : 'Load more products' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import ProductCard from '@/components/ProductCard.vue'
import RecommendationsCarousel from '@/components/RecommendationsCarousel.vue'
import type { Product } from '@/types/product'

const props = withDefaults(defineProps<{
  products: Product[]
  loading: boolean
  error: string | null
  brands: string[]
  selectedBrand: string
  searchQuery: string
  recommendationFilterField?: 'brand' | 'homepage' | 'category'
  enableSearch?: boolean
  enablePagination?: boolean
  enableLoadMore?: boolean
  canLoadMore?: boolean
  currentPage?: number
  totalPages?: number
}>(), {
  enableSearch: true,
  enablePagination: false,
  enableLoadMore: false,
  canLoadMore: false,
  currentPage: 1,
  totalPages: 1
})

const emit = defineEmits<{
  (event: 'select-brand', brand: string): void
  (event: 'search', query: string): void
  (event: 'page-change', page: number): void
  (event: 'load-more'): void
}>()

const filteredFilters = computed(() => {
  if (!props.enableSearch || !props.searchQuery?.trim()) {
    return props.brands
  }

  const query = props.searchQuery.toLowerCase()
  return props.brands.filter((brand) => brand.toLowerCase().includes(query))
})

const onSearchInput = (event: Event) => {
  if (!props.enableSearch) {
    return
  }

  const target = event.target as HTMLInputElement
  emit('search', target.value ?? '')
}

const recommendationFilterValue = computed(() => {
  if (props.recommendationFilterField === 'category') {
    if (props.selectedBrand && props.selectedBrand !== 'All') {
      return props.selectedBrand
    }
    return props.brands?.[0] ?? ''
  }

  return props.selectedBrand
})

const currentPage = computed(() => props.currentPage ?? 1)
const totalPages = computed(() => props.totalPages ?? 1)
</script>

<style scoped></style>

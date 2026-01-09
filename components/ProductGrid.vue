<template>
<section id="products" class="mt-20 space-y-8">
    <RecommendationsCarousel
      :filter-field="recommendationFilterField ?? 'brand'"
      :filter-value="selectedBrand"
      :category-hierarchy="categoryHierarchy"
    />
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

    <div v-if="loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 3" :key="n" class="h-96 animate-pulse rounded-3xl bg-slate-100"></div>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>

    <p v-if="error" class="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">{{ error }}</p>
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
  categoryHierarchy?: string[]
  enableSearch?: boolean
}>(), {
  enableSearch: true
})

const emit = defineEmits<{
  (event: 'select-brand', brand: string): void
  (event: 'search', query: string): void
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
</script>

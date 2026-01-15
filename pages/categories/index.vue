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
          <p class="font-semibold text-slate-900">Category tips</p>
          <p class="mt-2">
            Layer categories with brand filters to quickly zero in on the perfect kit.
          </p>
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
      :current-page="page"
      :total-pages="totalPages"
      :enable-pagination="true"
      recommendation-filter-field="category"
      @select-brand="onSelectCategory"
      @search="onSearch"
      @page-change="onPageChange"
    />
    <NewsletterBanner />
  </div>
</template>

<script setup lang="ts">
import NewsletterBanner from '@/components/NewsletterBanner.vue'
import ProductGrid from '@/components/ProductGrid.vue'

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
  page,
  totalPages,
  goToPage
} = useCategoryProducts()

await fetchProducts()

const onSelectCategory = (category: string) => {
  selectCategory(category)
}

const onSelectBrand = (brand: string) => {
  selectBrand(brand)
}

const onSearch = async (query: string) => {
  await searchProducts(query)
}

const onPageChange = async (nextPage: number) => {
  await goToPage(nextPage)
}
</script>

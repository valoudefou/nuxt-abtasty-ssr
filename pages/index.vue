<template>
  <div class="space-y-20">
    <HeroSection />
    <ProductGrid
      :products="products"
      :loading="loading"
      :error="error"
      :brands="brands"
      :selected-brand="selectedBrand"
      :search-query="searchQuery"
      @select-brand="onSelectBrand"
      @search="onSearch"
    />
    <FeatureGrid />
    <StoryHighlights />
    <NewsletterBanner />
  </div>
</template>

<script setup lang="ts">
const {
  products,
  brands,
  selectedBrand,
  searchQuery,
  loading,
  error,
  fetchProducts,
  fetchBrands,
  selectBrand,
  searchProducts
} = useProducts()

await Promise.all([fetchBrands(), fetchProducts()])

const onSelectBrand = async (brand: string) => {
  await selectBrand(brand)
}

const onSearch = async (query: string) => {
  await searchProducts(query)
}
</script>

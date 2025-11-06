<template>
  <div class="space-y-20">
    <HeroSection />
    <ProductGrid
      :products="products"
      :loading="loading"
      :error="error"
      :brands="brands"
      :selected-brand="selectedBrand"
      @select-brand="onSelectBrand"
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
  loading,
  error,
  fetchProducts,
  fetchBrands,
  selectBrand
} = useProducts()

await Promise.all([fetchBrands(), fetchProducts()])

const onSelectBrand = async (brand: string) => {
  await selectBrand(brand)
}
</script>

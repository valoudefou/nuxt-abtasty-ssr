<template>
  <div class="space-y-20">
    <HeroSection />
    <ProductGrid :products="products" :loading="loading" :error="error" />
    <FeatureGrid />
    <StoryHighlights />
    <NewsletterBanner />
  </div>
</template>

<script setup lang="ts">
const { products, loading, error, fetchProducts } = useProducts()

await fetchProducts()
</script>

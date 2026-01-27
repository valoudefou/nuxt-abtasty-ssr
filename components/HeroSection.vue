<template>
  <section class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-sky-500 px-8 py-20 text-white shadow-xl">
    <div class="grid gap-12 lg:grid-cols-[2fr,1fr]">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary-100">New Collection</p>
        <h1 class="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Elevated essentials for adventurous lives
        </h1>
        <p class="mt-6 max-w-xl text-lg text-primary-50">
          Discover performance-crafted apparel and accessories designed to transition seamlessly from morning commutes to weekend escapes.
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <NuxtLink :to="categoriesHref" class="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-slate-100">
            Explore categories
          </NuxtLink>
        </div>
      </div>
      <div class="relative hidden lg:block">
        <div class="absolute inset-0 rounded-3xl bg-white/10 blur-3xl"></div>
        <div class="relative rounded-3xl border border-white/20 bg-white/10 p-8 text-sm leading-6 text-primary-50 shadow-2xl">
          <h3 class="text-base font-semibold text-white">Designed for motion</h3>
          <p class="mt-4">
            We obsess over technical fabrics and precise tailoring to create pieces that breathe, move, and layer effortlessly.
          </p>
          <ul class="mt-6 space-y-3">
            <li class="flex items-start gap-3">
              <CheckCircleIcon class="mt-1 h-5 w-5 flex-shrink-0 text-emerald-300" />
              <span>Climate-ready protection and insulation options</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircleIcon class="mt-1 h-5 w-5 flex-shrink-0 text-emerald-300" />
              <span>Fair-wage production partners across the globe</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircleIcon class="mt-1 h-5 w-5 flex-shrink-0 text-emerald-300" />
              <span>Lifetime repairs and recycling program</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'

const activeVendor = useState<string>('active-vendor', () => '')
const categoriesHref = computed(() => {
  const vendor = activeVendor.value?.trim()
  return vendor ? `/v/${encodeURIComponent(vendor)}/categories` : '/categories'
})
</script>

<template>
  <section class="mt-24" id="stories">
    <div class="rounded-3xl bg-white p-10 shadow-xl ring-1 ring-slate-100">
      <div class="grid gap-10 lg:grid-cols-3">
        <div>
          <h2 class="section-title">What sets us apart</h2>
          <p class="section-subtitle">
            Every piece is engineered to keep you comfortable during the moments that matter most.
          </p>
        </div>
        <dl class="grid gap-8 sm:grid-cols-2 lg:col-span-2">
          <div v-for="feature in features" :key="feature.title" class="rounded-2xl border border-slate-200 p-6 transition hover:border-primary-200 hover:shadow-md">
            <dt class="flex items-center gap-3 text-sm font-semibold text-slate-900">
              <component :is="feature.icon" class="h-6 w-6 text-primary-500" />
              {{ feature.title }}
            </dt>
            <dd class="mt-3 text-sm leading-6 text-slate-600">{{ feature.description }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { BeakerIcon, GlobeAltIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/vue/24/outline'

const features = [
  {
    title: 'Performance fabrics',
    description: 'Temperature regulating and moisture-wicking textiles keep you in your comfort zone all day long.',
    icon: BeakerIcon
  },
  {
    title: 'Global craftsmanship',
    description: 'Produced in small batches with manufacturing partners certified for ethical practices.',
    icon: GlobeAltIcon
  },
  {
    title: 'Lifetime care',
    description: 'Complimentary repairs and recycling program ensure every piece lives many lives.',
    icon: ShieldCheckIcon
  },
  {
    title: 'Limited releases',
    description: 'Seasonal drops and collaborations offer distinctive silhouettes you will not find elsewhere.',
    icon: SparklesIcon
  }
]
</script>

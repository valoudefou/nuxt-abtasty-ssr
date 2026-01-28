<template>
  <section class="mt-24">
    <div class="grid gap-10 lg:grid-cols-[3fr,2fr] lg:items-start">
      <div class="rounded-3xl border border-slate-200 bg-white p-10 shadow-lg">
        <h2 class="section-title">Inside the journal</h2>
        <p class="section-subtitle">
          Field notes from expeditions, design studios, and the people who inspire how we move through the world.
        </p>
        <div class="mt-10 space-y-8">
          <article v-for="story in stories" :key="story.title" class="flex flex-col gap-3">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">{{ story.category }}</p>
            <h3 class="text-xl font-semibold text-slate-900">{{ story.title }}</h3>
            <p class="text-sm leading-6 text-slate-600">{{ story.excerpt }}</p>
            <NuxtLink to="/journal" class="inline-flex items-center text-sm font-semibold text-primary-600">
              Read story
              <ArrowRightIcon class="ml-2 h-4 w-4" />
            </NuxtLink>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from '@heroicons/vue/24/solid'

const stories = [
  {
    title: 'Designing a modular layering system for unpredictable climates',
    excerpt: 'Our design director unpacks how we built the Skyline system to perform in both alpine and urban conditions.',
    category: 'Design'
  },
  {
    title: 'Tracking a week-long trail run through Patagonia',
    excerpt: 'Athlete-in-residence Mason Kho shares the gear that handled everything from sudden rain to high-altitude winds.',
    category: 'Field notes'
  },
  {
    title: 'How we source regenerative merino wool',
    excerpt: 'A look inside our partnership with family-run farms pioneering regenerative agriculture in New Zealand.',
    category: 'Sustainability'
  }
]

</script>

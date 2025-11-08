<template>
  <section class="rounded-3xl border-slate-200 backdrop-blur">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 class="section-title">{{ heading }}</h3>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-500 hover:text-primary-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          :disabled="!hasRecommendations || loading || !canScrollPrev"
          @click="scrollCarousel('prev')"
        >
          Prev
        </button>
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-500 hover:text-primary-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          :disabled="!hasRecommendations || loading || !canScrollNext"
          @click="scrollCarousel('next')"
        >
          Next
        </button>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ errorMessage }}
    </p>

    <div v-else-if="loading" class="mt-6 flex gap-6 overflow-hidden">
      <div v-for="n in 3" :key="n" class="h-64 w-72 flex-shrink-0 rounded-3xl bg-slate-100"></div>
    </div>

    <div
      v-else-if="hasRecommendations"
      ref="carouselRef"
      class="mt-6 flex mb-10 gap-6 overflow-x-auto overflow-y-visible scroll-smooth pb-8 -mb-8 px-6 -mx-6"
    >
      <article
        v-for="item in recommendations"
        :key="item.id"
        class="reco-card relative flex w-72 flex-shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      >
        <button
          type="button"
          class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 transition hover:text-rose-500"
          aria-label="Remove recommendation"
          @click.stop="dismissItem(item.id)"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div class="relative overflow-hidden rounded-2xl bg-slate-100">
          <img
            :src="item.product.image || placeholderImage"
            :alt="item.product.name"
            class="h-48 w-full object-cover transition duration-500 hover:scale-105"
          />
        </div>

        <div class="mt-4 flex items-start justify-between gap-3">
          <p class="text-base font-semibold text-slate-900">{{ item.product.name }}</p>
          <span class="text-base font-semibold text-primary-600">{{ formatCurrency(item.product.price) }}</span>
        </div>

        <p class="mt-2 text-sm text-slate-600">
          {{ item.product.description }}
        </p>

        <div class="mt-6 flex flex-row items-center gap-3">
          <button
            type="button"
            class="inline-flex basis-1/3 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 p-2 text-white shadow-sm transition hover:bg-primary-500"
            @click="addRecommendationToCart(item)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              class="h-5 w-5"
            >
              <path
                d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
              />
            </svg>
          </button>

          <NuxtLink
            v-if="item.detailUrl"
            :to="item.detailUrl"
            class="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            View detail
          </NuxtLink>

          <a
            v-else-if="item.externalUrl"
            :href="item.externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            View detail
          </a>
        </div>
      </article>
    </div>

    <p v-else class="mt-4 text-sm text-slate-500">
      There are no recommendations available right now. Please check back later.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Product } from '@/types/product'

const placeholderImage = 'https://assets-manager.abtasty.com/placeholder.png'

type RecommendationItem = {
  id: string
  product: Product
  detailUrl?: string
  externalUrl?: string
}

type RecommendationPayload = {
  title: string
  items: RecommendationItem[]
}

const headingState = useState<string>('recommendations-heading', () => 'Recommended for you')
const recommendations = useState<RecommendationItem[]>('recommendations-items', () => [])
const recommendationsLoaded = useState<boolean>('recommendations-loaded', () => false)
const recommendationsLoading = useState<boolean>('recommendations-loading', () => false)
const recommendationsError = useState<string | null>('recommendations-error', () => null)

const ensureRecommendations = async () => {
  if (recommendationsLoaded.value || recommendationsLoading.value) {
    return
  }

  recommendationsLoading.value = true
  recommendationsError.value = null

  try {
    const payload = await $fetch<RecommendationPayload>('/api/recommendations')
    headingState.value = payload?.title ?? 'Recommended for you'
    recommendations.value = payload?.items ?? []
    recommendationsLoaded.value = true
  } catch (err) {
    console.error('Failed to load recommendations', err)
    recommendationsError.value = 'Unable to load recommendations right now.'
  } finally {
    recommendationsLoading.value = false
  }
}

await ensureRecommendations()

const heading = computed(() => headingState.value)

const carouselRef = ref<HTMLDivElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)

const cart = useCart()

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})

const hasRecommendations = computed(() => recommendations.value.length > 0)
const loading = computed(() => recommendationsLoading.value && !recommendationsLoaded.value)
const errorMessage = computed(() => recommendationsError.value)

const updateScrollState = () => {
  const el = carouselRef.value

  if (!el) {
    canScrollPrev.value = false
    canScrollNext.value = false
    return
  }

  canScrollPrev.value = el.scrollLeft > 0
  canScrollNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

let detachScrollListener: (() => void) | null = null

const attachScrollListener = () => {
  if (detachScrollListener) {
    detachScrollListener()
    detachScrollListener = null
  }

  const el = carouselRef.value
  if (!el) return

  const handleScroll = () => updateScrollState()
  el.addEventListener('scroll', handleScroll, { passive: true })
  detachScrollListener = () => el.removeEventListener('scroll', handleScroll)
}

const syncCarousel = async () => {
  if (!import.meta.client) {
    return
  }

  await nextTick()
  if (!hasRecommendations.value) {
    if (detachScrollListener) {
      detachScrollListener()
      detachScrollListener = null
    }
    updateScrollState()
    return
  }

  attachScrollListener()
  updateScrollState()
}

const dismissItem = (id: string) => {
  recommendations.value = recommendations.value.filter((item) => item.id !== id)
  void syncCarousel()
}

const formatCurrency = (value: number) => currencyFormatter.format(value)

const addRecommendationToCart = (item: RecommendationItem) => {
  cart.addItem(item.product)
}

const scrollCarousel = (direction: 'prev' | 'next') => {
  const el = carouselRef.value
  if (!el) return

  const card = el.querySelector<HTMLElement>('.reco-card')
  const step = card ? card.getBoundingClientRect().width + 24 : 300

  el.scrollBy({
    left: direction === 'next' ? step : -step,
    behavior: 'smooth'
  })
}

const handleResize = () => updateScrollState()

watch(
  () => recommendations.value.length,
  () => {
    void syncCarousel()
  }
)

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('resize', handleResize)
  }

  void syncCarousel()
})

onBeforeUnmount(() => {
  if (detachScrollListener) {
    detachScrollListener()
    detachScrollListener = null
  }

  if (import.meta.client) {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<template>
  <div>
    <header ref="headerRef" class="fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur">
      <nav class="mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">
        <NuxtLink
          to="/"
          class="flex flex-1 items-center gap-2 text-xl font-semibold text-primary-600"
          @click="handleNavClick"
        >
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <ShoppingBagIcon class="h-6 w-6" />
          </span>
          Commerce Demo
        </NuxtLink>
        <div class="hidden flex-1 items-center justify-center gap-8 text-sm font-medium md:flex">
          <NuxtLink
            v-for="item in navigation"
            :key="item.href"
            :to="item.href"
            :class="['inline-flex items-center gap-2', desktopLinkClass(item.href)]"
            @click="handleNavClick"
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              class="h-4 w-4 text-rose-500"
              aria-hidden="true"
            />
            {{ item.label }}
          </NuxtLink>
        </div>
        <div class="flex flex-1 items-center justify-end gap-4">
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-primary-500 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Search products"
            @click="openOverlay"
          >
            <MagnifyingGlassIcon class="h-5 w-5" />
          </button>
          <NuxtLink
            to="/cart"
            class="relative inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            @click="handleNavClick"
          >
            <ShoppingCartIcon class="mr-2 h-5 w-5" />
            Cart
            <span
              v-if="totalItems"
              class="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-primary-600"
            >
              {{ totalItems }}
            </span>
          </NuxtLink>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-primary-500 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
            :aria-expanded="isMobileMenuOpen"
            aria-label="Toggle navigation menu"
            @click="toggleMobileMenu"
          >
            <Bars3Icon class="h-6 w-6" v-if="!isMobileMenuOpen" />
            <XMarkIcon class="h-6 w-6" v-else />
          </button>
        </div>
      </nav>
    </header>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-4"
    >
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm md:hidden"
        @click.self="closeMobileMenu"
      >
        <div class="absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <span class="text-sm font-semibold text-slate-700">Menu</span>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Close navigation menu"
              @click="closeMobileMenu"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <nav class="flex flex-col gap-1 p-4">
            <NuxtLink
              v-for="item in navigation"
              :key="item.href"
              :to="item.href"
              :class="mobileLinkClass(item.href)"
              @click="handleNavClick"
            >
              <span class="flex items-center gap-2">
                <component
                  :is="item.icon"
                  v-if="item.icon"
                  class="h-4 w-4 text-rose-500"
                  aria-hidden="true"
                />
                {{ item.label }}
              </span>
              <span aria-hidden="true" class="text-sm text-slate-400">&gt;</span>
            </NuxtLink>
          </nav>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <section
        v-if="isOverlayOpen"
        ref="overlaySectionRef"
        class="fixed inset-x-0 bottom-0 z-50 overflow-y-auto border-t border-slate-200 bg-white/95 backdrop-blur"
        :style="{ top: overlayOffset }"
        @scroll.passive="handleOverlayScroll"
      >
        <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div class="relative flex-1">
              <MagnifyingGlassIcon class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                name="overlay-search"
                inputmode="search"
                enterkeyhint="search"
                class="h-12 w-full rounded-full border border-slate-200 bg-white/90 pl-12 pr-14 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Search the catalog"
                autocomplete="off"
                spellcheck="false"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-slate-600"
                aria-label="Clear search"
                @click="clearSearch"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              @click="closeOverlay"
            >
              <XMarkIcon class="h-5 w-5" />
              Close
            </button>
          </div>

          <div class="flex flex-col gap-6">
            <div v-if="hasMinimumQuery" class="flex flex-col gap-6 lg:flex-row">
              <aside
                v-if="isDesktop || isFilterPanelOpen"
                class="sticky top-6 flex flex-col gap-6 self-start rounded-2xl border border-slate-200 bg-white/70 p-4 lg:w-64 lg:border-0 lg:bg-transparent lg:p-0"
              >
                <div>
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
                    <button
                      v-if="selectedCategories.length"
                      type="button"
                      class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                      @click="clearCategoryFilter"
                    >
                      Clear
                    </button>
                  </div>
                  <div class="mt-3 h-56 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/80 p-2">
                    <button
                      v-for="category in categoryOptions"
                      :key="category"
                      type="button"
                      class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition"
                      :class="selectedCategories.includes(category)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-700 hover:bg-slate-100'"
                      @click="toggleCategoryFilter(category)"
                    >
                      <span class="truncate">{{ category }}</span>
                      <span
                        class="ml-3 h-4 w-4 rounded-full border border-slate-300"
                        :class="selectedCategories.includes(category)
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white'"
                      ></span>
                    </button>
                    <p v-if="!categoryOptions.length" class="px-3 py-2 text-xs text-slate-500">
                      No categories found.
                    </p>
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Brands</p>
                    <button
                      v-if="selectedBrand"
                      type="button"
                      class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                      @click="clearBrandFilter"
                    >
                      Clear
                    </button>
                  </div>
                  <div class="mt-3 h-56 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/80 p-2">
                    <button
                      v-for="brand in brandOptions"
                      :key="brand"
                      type="button"
                      class="flex w-full items-center justify-between rounded-full px-4 py-2 text-sm font-medium transition"
                      :class="
                        selectedBrand === brand
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-slate-600 hover:bg-slate-100'
                      "
                      @click="toggleBrandFilter(brand)"
                    >
                      {{ brand }}
                    </button>
                    <p v-if="!brandOptions.length" class="px-4 py-2 text-sm text-slate-500">
                      No brand facets for this search.
                    </p>
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p>
                    <button
                      v-if="hasCustomPriceRange"
                      type="button"
                      class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                      @click="resetPriceFilter"
                    >
                      Reset
                    </button>
                  </div>
                  <div class="mt-3 space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <div class="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{{ formatPrice(selectedPriceMin) }}</span>
                      <span class="text-slate-400">to</span>
                      <span>{{ formatPrice(selectedPriceMax) }}</span>
                    </div>
                    <div class="relative pt-5 pb-2">
                      <div class="pointer-events-none absolute inset-x-1 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200">
                        <div
                          class="absolute h-2 rounded-full bg-primary-300"
                          :style="{ left: priceFillStyle.left, right: priceFillStyle.right }"
                        />
                      </div>
                      <input
                        type="range"
                        :min="PRICE_SLIDER_MIN"
                        :max="PRICE_SLIDER_MAX"
                        :step="PRICE_SLIDER_STEP"
                        :value="selectedPriceMin"
                        class="range-input absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 transform cursor-pointer"
                        @input="handleMinPriceInput"
                      />
                      <input
                        type="range"
                        :min="PRICE_SLIDER_MIN"
                        :max="PRICE_SLIDER_MAX"
                        :step="PRICE_SLIDER_STEP"
                        :value="selectedPriceMax"
                        class="range-input absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 transform cursor-pointer"
                        @input="handleMaxPriceInput"
                      />
                    </div>
                    <div class="flex items-center justify-between text-xs text-slate-500">
                      <span>{{ formatPrice(PRICE_SLIDER_MIN) }}</span>
                      <span>{{ formatPrice(PRICE_SLIDER_MAX) }}</span>
                    </div>
                  </div>
                </div>
              </aside>
              <div class="flex-1">
                <div class="sticky top-0 z-10 -mx-4 px-4 pb-1 pt-2 lg:hidden">
                  <div class="flex items-center justify-end">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-full bg-white/95 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-500 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      @click="toggleFiltersPanel"
                    >
                      <AdjustmentsHorizontalIcon class="h-5 w-5" />
                      <span>{{ isFilterPanelOpen ? 'Hide filters' : 'Filters' }}</span>
                    </button>
                  </div>
                </div>
                <div
                  v-if="isSearching"
                  class="rounded-2xl border border-slate-200 bg-white/80 px-6 py-12 text-center text-sm text-slate-500"
                >
                  Searching products...
                </div>
                <div
                  v-else-if="searchError"
                  class="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700"
                >
                  {{ searchError }}
                </div>
                <div
                  v-else-if="searchResults.length === 0"
                  class="rounded-2xl border border-slate-200 bg-white/80 px-6 py-12 text-center text-sm text-slate-500"
                >
                  No products found for "{{ searchQuery.trim() }}".
                </div>
                <div v-else class="relative">
                  <div
                    v-if="autocompleteSuggestions.length"
                    class="pointer-events-auto no-scrollbar absolute inset-x-0 top-0 z-10 overflow-x-auto whitespace-nowrap px-1 py-2"
                  >
                    <div class="no-scrollbar flex items-center gap-2">
                      <button
                        v-for="suggestion in autocompleteSuggestions"
                        :key="suggestion"
                        type="button"
                        class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        @click="applySuggestion(suggestion)"
                      >
                        <MagnifyingGlassIcon class="h-4 w-4 text-slate-500" />
                        <span>{{ suggestion }}</span>
                      </button>
                    </div>
                  </div>
                  <div
                    class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    :class="{ 'pt-16': autocompleteSuggestions.length }"
                  >
                    <article
                      v-for="product in searchResults"
                      :key="product.id"
                      class="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div class="relative overflow-hidden rounded-xl bg-slate-100">
                        <span
                          v-if="product.tag"
                          class="absolute left-3 top-3 z-10 max-w-[75%] truncate rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-black/5 backdrop-blur"
                        >
                          {{ product.tag }}
                        </span>
                        <img :src="product.image" :alt="product.name" class="h-48 w-full object-cover" />
                      </div>
                      <div class="mt-4">
                        <p class="text-sm font-semibold text-slate-900">
                          {{ product.name }}
                        </p>
                        <p class="text-xs uppercase tracking-wide text-slate-500" v-if="product.brand">
                          {{ product.brand }}
                        </p>
                        <p class="mt-1 text-base font-semibold text-primary-600" v-if="product.price !== null">
                          {{ formatPrice(product.price) }}
                        </p>
                      </div>
                      <div class="mt-6 flex flex-row items-center gap-3">
                        <button
                          type="button"
                          class="inline-flex basis-1/3 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 p-2 text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                          :disabled="isAddingToCart[product.id] === true"
                          @click="addSearchResultToCart(product)"
                        >
                          <ShoppingCartIcon class="h-5 w-5" />
                          <span class="sr-only">Add to cart</span>
                        </button>
                        <NuxtLink
                          :to="product.link"
                          class="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                          @click="closeOverlay"
                        >
                          View detail
                        </NuxtLink>
                      </div>
                    </article>
                  </div>
                  <div class="mt-6 flex flex-col items-center gap-3">
                    <button
                      v-if="canLoadMore"
                      type="button"
                      class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="isLoadingMore || isSearching"
                      @click="loadMoreResults"
                    >
                      <span v-if="isLoadingMore">Loading more...</span>
                      <span v-else>Load more results</span>
                    </button>
                    <p class="text-xs text-slate-500">
                      Showing {{ searchResults.length }} of {{ totalHits || searchResults.length }} results
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else>
              <div
                class="rounded-2xl border border-slate-200 bg-white/80 px-6 py-12 text-center text-sm text-slate-500"
              >
                <template v-if="!searchQuery.trim().length">
                  Start typing to search the catalog.
                </template>
                <template v-else>
                  Keep typing at least two characters to see results.
                </template>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import {
  AdjustmentsHorizontalIcon,
  Bars3Icon,
  HeartIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid'

import type { Product } from '@/types/product'

interface ApiSearchHit {
  id: number | string
  name: string
  img_link?: string
  link?: string
  price?: number | string | null
  brand?: string | null
  tag?: string | null
  tags?: string[] | string | null
  vendor?: string | null
  category_id?: string | null
  categories_ids?: string[] | null
}

interface ApiFacetResponse {
  brand?: {
    values?: [string, number][]
  }
}

interface ApiSearchResponse {
  hits?: ApiSearchHit[]
  facets?: ApiFacetResponse
  totalPages?: number
  page?: number
  hitsPerPage?: number
  totalHits?: number
}

interface SearchHit {
  id: string
  name: string
  image: string
  link: string
  price: number | null
  brand: string | null
  tag: string | null
  categories: string[]
}

const SEARCH_ENDPOINT = '/api/abtasty-search'
const AUTOCOMPLETE_ENDPOINT = 'https://search-api.abtasty.com/autocomplete'
const AUTOCOMPLETE_CLIENT_ID = '47c5c9b4ee0a19c9859f47734c1e8200'
const FALLBACK_IMAGE = 'https://assets-manager.abtasty.com/placeholder.png'
const PRICE_SLIDER_MIN = 0
const PRICE_SLIDER_MAX = 500
const PRICE_SLIDER_STEP = 5
const SEARCH_HITS_PER_PAGE = 24

const cart = useCart()
const { totalItems } = cart
const activeVendor = useState<string>('active-vendor', () => '')

type NavigationItem = {
  label: string
  href: string
  icon?: Component
}

const withVendorPrefix = (href: string) => {
  const vendor = activeVendor.value?.trim()
  if (!vendor) return href
  const suffix = href === '/' ? '' : href
  return `/v/${encodeURIComponent(vendor)}${suffix}`
}

const navigation = computed<NavigationItem[]>(() => [
  { label: 'Home', href: withVendorPrefix('/') },
  { label: 'Categories', href: withVendorPrefix('/categories') },
  { label: 'Valentines', href: withVendorPrefix('/valentines-day'), icon: HeartIcon }
])

const route = useRoute()

const isActiveLink = (href: string) => route.path === href

const desktopLinkClass = (href: string) =>
  [
    'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    isActiveLink(href) ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'
  ].join(' ')

const mobileLinkClass = (href: string) =>
  [
    'flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
    isActiveLink(href)
      ? 'bg-primary-50 text-primary-700'
      : 'text-slate-700 hover:bg-primary-50 hover:text-primary-700'
  ].join(' ')

const headerRef = ref<HTMLElement | null>(null)
const overlaySectionRef = ref<HTMLElement | null>(null)
const overlayOffset = ref('4.5rem')
const searchInputRef = ref<HTMLInputElement | null>(null)
const isOverlayOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isFilterPanelOpen = ref(true)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const searchQuery = ref('')
const searchResults = ref<SearchHit[]>([])
const searchError = ref('')
const isSearching = ref(false)
const isLoadingMore = ref(false)
const brandOptions = ref<string[]>([])
const categoryOptions = ref<string[]>([])
const selectedBrand = ref<string | null>(null)
const selectedCategories = ref<string[]>([])
const selectedPriceMin = ref(PRICE_SLIDER_MIN)
const selectedPriceMax = ref(PRICE_SLIDER_MAX)
const autocompleteSuggestions = ref<string[]>([])
const currentPage = ref(0)
const totalPages = ref(0)
const totalHits = ref(0)

const hasMinimumQuery = computed(() => searchQuery.value.trim().length >= 2)
const isDesktop = computed(() => viewportWidth.value >= 1024)
const hasCustomPriceRange = computed(
  () => selectedPriceMin.value > PRICE_SLIDER_MIN || selectedPriceMax.value < PRICE_SLIDER_MAX
)
const priceFillStyle = computed(() => {
  const span = PRICE_SLIDER_MAX - PRICE_SLIDER_MIN || 1
  const left = ((selectedPriceMin.value - PRICE_SLIDER_MIN) / span) * 100
  const right = ((selectedPriceMax.value - PRICE_SLIDER_MIN) / span) * 100
  return {
    left: `${Math.max(0, Math.min(left, 100))}%`,
    right: `${Math.max(0, Math.min(100 - right, 100))}%`
  }
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
})

const formatPrice = (value: number) => currencyFormatter.format(value)
const triggerSearchWithFilters = () => {
  if (hasMinimumQuery.value) {
    performSearch(searchQuery.value)
  }
}

const normalizePrice = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const normalizeTag = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = normalizeTag(entry)
      if (candidate) return candidate
    }
    return null
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return normalizeTag(record.label) ?? normalizeTag(record.name) ?? null
  }

  return null
}

const normalizeHit = (hit: ApiSearchHit): SearchHit => ({
  id: String(hit.id),
  name: hit.name,
  image: hit.img_link || FALLBACK_IMAGE,
  link: hit.link || `/products/${hit.id}`,
  price: normalizePrice(hit.price),
  brand: hit.brand?.trim() || null,
  tag: normalizeTag(hit.tag) ?? normalizeTag(hit.tags),
  categories: Array.isArray(hit.categories_ids)
    ? hit.categories_ids.map((entry) => entry?.trim()).filter((entry): entry is string => Boolean(entry))
    : hit.category_id
      ? [hit.category_id.trim()].filter(Boolean)
      : []
})

const isAddingToCart = ref<Record<string, boolean>>({})

let latestRequestId = 0
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
let autocompleteRequestId = 0
let suppressAutocomplete = false

const addSearchResultToCart = async (hit: SearchHit) => {
  const id = String(hit.id).trim()
  if (!id) return
  if (isAddingToCart.value[id]) return

  isAddingToCart.value = { ...isAddingToCart.value, [id]: true }
  try {
    const product = await $fetch<Product>(`/api/products/${encodeURIComponent(id)}`)
    cart.addItem(product)
  } catch (error) {
    console.error('Failed to add search result to cart', { id }, error)
  } finally {
    isAddingToCart.value = { ...isAddingToCart.value, [id]: false }
  }
}

const performSearch = async (query: string, options: { page?: number; append?: boolean } = {}) => {
  const trimmed = query.trim()
  const requestId = ++latestRequestId
  const normalizedVendor = activeVendor.value?.trim() || ''
  const requestedPage = options.page ?? 0
  const shouldAppend = Boolean(options.append)

  if (trimmed.length < 2) {
    console.debug('[Search] skip: query too short', { query: trimmed })
    searchResults.value = []
    searchError.value = ''
    isSearching.value = false
    currentPage.value = 0
    totalPages.value = 0
    totalHits.value = 0
    return
  }

  if (shouldAppend) {
    isLoadingMore.value = true
  } else {
    isSearching.value = true
  }
  searchError.value = ''
  console.debug('[Search] start', {
    query: trimmed,
    vendor: normalizedVendor || null,
    brand: selectedBrand.value,
    price: {
      min: selectedPriceMin.value,
      max: selectedPriceMax.value,
      custom: hasCustomPriceRange.value
    },
    page: requestedPage
  })

  try {
    const url = new URL(SEARCH_ENDPOINT, window.location.origin)
    url.searchParams.set('text', trimmed)
    url.searchParams.set('page', String(requestedPage))
    url.searchParams.set('hitsPerPage', String(SEARCH_HITS_PER_PAGE))

    if (selectedBrand.value) {
      url.searchParams.append('brand', selectedBrand.value)
    }
    if (selectedCategories.value.length) {
      for (const category of selectedCategories.value) {
        url.searchParams.append('category', category)
      }
    }
    if (hasCustomPriceRange.value) {
      url.searchParams.append('priceMin', String(selectedPriceMin.value))
      url.searchParams.append('priceMax', String(selectedPriceMax.value))
    }

    console.debug('[Search] request', {
      url: url.toString(),
      vendor: normalizedVendor || null,
      brand: selectedBrand.value,
      categories: selectedCategories.value,
      priceRange: hasCustomPriceRange.value
        ? { min: selectedPriceMin.value, max: selectedPriceMax.value }
        : null,
      page: requestedPage
    })

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('[Search] response error', {
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`Search failed with status ${response.status}`)
    }

    const data = (await response.json()) as ApiSearchResponse

    if (requestId !== latestRequestId) {
      console.debug('[Search] stale response ignored', { requestId, latestRequestId })
      return
    }

    const normalizedHits = (data.hits ?? []).map(normalizeHit)
    if (shouldAppend) {
      searchResults.value = [...searchResults.value, ...normalizedHits]
    } else {
      searchResults.value = normalizedHits
    }
    currentPage.value = Number.isFinite(data.page) ? Number(data.page) : requestedPage
    totalPages.value = Number.isFinite(data.totalPages) ? Number(data.totalPages) : 0
    totalHits.value = Number.isFinite(data.totalHits) ? Number(data.totalHits) : searchResults.value.length
    console.debug('[Search] results', {
      totalHits: normalizedHits.length,
      brandsFacetCount: data.facets?.brand?.values?.length ?? 0,
      page: currentPage.value,
      totalPages: totalPages.value,
      totalHitsAll: totalHits.value
    })

    const sourceHits = shouldAppend ? searchResults.value : normalizedHits
    const brandsFromHits = Array.from(
      new Set(
        sourceHits
          .map((hit) => hit.brand?.trim())
          .filter((brand): brand is string => Boolean(brand))
      )
    ).sort((a, b) => a.localeCompare(b))

    if (brandsFromHits.length > 0) {
      brandOptions.value = selectedBrand.value && !brandsFromHits.includes(selectedBrand.value)
        ? [...brandsFromHits, selectedBrand.value].sort((a, b) => a.localeCompare(b))
        : brandsFromHits
    } else {
      const brandsFromFacets =
        data.facets?.brand?.values
          ?.map(([label]) => label?.trim())
          .filter((label): label is string => Boolean(label)) ?? []
      brandOptions.value = selectedBrand.value && !brandsFromFacets.includes(selectedBrand.value)
        ? [...brandsFromFacets, selectedBrand.value].sort((a, b) => a.localeCompare(b))
        : brandsFromFacets
    }
    console.debug('[Search] brand options', { count: brandOptions.value.length })

    const categoriesFromHits = Array.from(
      new Set(
        sourceHits.flatMap((hit) => hit.categories)
      )
    ).sort((a, b) => a.localeCompare(b))

    if (categoriesFromHits.length > 0) {
      const selected = selectedCategories.value
      categoryOptions.value = selected.length
        ? Array.from(new Set([...categoriesFromHits, ...selected])).sort((a, b) => a.localeCompare(b))
        : categoriesFromHits
    } else {
      categoryOptions.value = selectedCategories.value.slice().sort((a, b) => a.localeCompare(b))
    }
    console.debug('[Search] category options', { count: categoryOptions.value.length })
  } catch (error) {
    if (requestId !== latestRequestId) {
      console.debug('[Search] error ignored for stale request', { requestId, latestRequestId })
      return
    }
    console.error('Failed to search products from header search', error)
    searchError.value = 'We were unable to search products right now.'
    searchResults.value = []
    currentPage.value = 0
    totalPages.value = 0
    totalHits.value = 0
    categoryOptions.value = []
  } finally {
    if (requestId === latestRequestId) {
      isSearching.value = false
      isLoadingMore.value = false
    }
  }
}

const scheduleSearch = (value: string) => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
    debounceTimeout = null
  }

  debounceTimeout = setTimeout(() => performSearch(value), 300)
}

watch(searchQuery, (value) => {
  const trimmed = value.trim()
  if (!trimmed) {
    searchResults.value = []
    searchError.value = ''
    isSearching.value = false
    if (!suppressAutocomplete) {
      autocompleteSuggestions.value = []
    } else {
      suppressAutocomplete = false
    }
    return
  }

  if (trimmed.length < 2) {
    searchResults.value = []
    searchError.value = ''
    isSearching.value = false
    if (!suppressAutocomplete) {
      void performAutocomplete(trimmed)
    } else {
      suppressAutocomplete = false
    }
    return
  }

  if (!suppressAutocomplete) {
    void performAutocomplete(trimmed)
  } else {
    suppressAutocomplete = false
  }
  scheduleSearch(trimmed)
})

watch(isOverlayOpen, (isOpen) => {
  nextTick(() => {
    if (isOpen) {
      searchInputRef.value?.focus()
    }
  })
})

watch(
  () => route.fullPath,
  () => {
    if (isMobileMenuOpen.value) {
      closeMobileMenu()
    }
  }
)

const updateOverlayOffset = () => {
  const height = headerRef.value?.getBoundingClientRect().height
  overlayOffset.value = height ? `${height}px` : '4.5rem'
}

const handleResize = () => {
  viewportWidth.value = window.innerWidth
  if (isDesktop.value) {
    isFilterPanelOpen.value = true
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleNavClick = () => {
  closeOverlay()
  closeMobileMenu()
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const toggleFiltersPanel = () => {
  isFilterPanelOpen.value = !isFilterPanelOpen.value
}

const handleOverlayScroll = () => {
  if (isDesktop.value || !overlaySectionRef.value) {
    return
  }

  if (overlaySectionRef.value.scrollTop > 12 && isFilterPanelOpen.value) {
    isFilterPanelOpen.value = false
  }
}

const openOverlay = () => {
  closeMobileMenu()
  isOverlayOpen.value = true
  isFilterPanelOpen.value = true
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  searchError.value = ''
  isSearching.value = false
  selectedBrand.value = null
  selectedCategories.value = []
  selectedPriceMin.value = PRICE_SLIDER_MIN
  selectedPriceMax.value = PRICE_SLIDER_MAX
  brandOptions.value = []
  categoryOptions.value = []
  autocompleteSuggestions.value = []
  currentPage.value = 0
  totalPages.value = 0
  totalHits.value = 0
  nextTick(() => searchInputRef.value?.focus())
}

const closeOverlay = () => {
  isOverlayOpen.value = false
  searchQuery.value = ''
  searchResults.value = []
  searchError.value = ''
  isSearching.value = false
  selectedBrand.value = null
  brandOptions.value = []
  selectedCategories.value = []
  categoryOptions.value = []
  autocompleteSuggestions.value = []
  selectedPriceMin.value = PRICE_SLIDER_MIN
  selectedPriceMax.value = PRICE_SLIDER_MAX
  isFilterPanelOpen.value = true
  currentPage.value = 0
  totalPages.value = 0
  totalHits.value = 0
}

const toggleBrandFilter = (brand: string) => {
  const normalized = brand.trim()

  if (!normalized) {
    return
  }

  selectedBrand.value = selectedBrand.value === normalized ? null : normalized

  triggerSearchWithFilters()
}

const toggleCategoryFilter = (category: string) => {
  const normalized = category.trim()
  if (!normalized) {
    return
  }
  const next = new Set(selectedCategories.value)
  if (next.has(normalized)) {
    next.delete(normalized)
  } else {
    next.add(normalized)
  }
  selectedCategories.value = Array.from(next)
  triggerSearchWithFilters()
}

const clearCategoryFilter = () => {
  if (!selectedCategories.value.length) {
    return
  }
  selectedCategories.value = []
  triggerSearchWithFilters()
}

const clearBrandFilter = () => {
  if (!selectedBrand.value) {
    return
  }

  selectedBrand.value = null

  triggerSearchWithFilters()
}

const clampMinPrice = (value: number) =>
  Math.min(Math.max(value, PRICE_SLIDER_MIN), selectedPriceMax.value - PRICE_SLIDER_STEP)
const clampMaxPrice = (value: number) =>
  Math.max(Math.min(value, PRICE_SLIDER_MAX), selectedPriceMin.value + PRICE_SLIDER_STEP)

const updateMinPrice = (value: number) => {
  const next = clampMinPrice(value)
  if (next !== selectedPriceMin.value) {
    selectedPriceMin.value = next
    triggerSearchWithFilters()
  }
}

const updateMaxPrice = (value: number) => {
  const next = clampMaxPrice(value)
  if (next !== selectedPriceMax.value) {
    selectedPriceMax.value = next
    triggerSearchWithFilters()
  }
}

const canLoadMore = computed(() => totalPages.value > 0 && currentPage.value + 1 < totalPages.value)

const loadMoreResults = () => {
  if (isSearching.value || isLoadingMore.value || !canLoadMore.value) {
    return
  }
  const nextPage = currentPage.value + 1
  void performSearch(searchQuery.value, { page: nextPage, append: true })
}

const handleMinPriceInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  updateMinPrice(value)
}

const handleMaxPriceInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  updateMaxPrice(value)
}

const resetPriceFilter = () => {
  selectedPriceMin.value = PRICE_SLIDER_MIN
  selectedPriceMax.value = PRICE_SLIDER_MAX
  triggerSearchWithFilters()
}

const applySuggestion = (suggestion: string) => {
  const normalized = suggestion.trim()
  if (!normalized) {
    return
  }

  suppressAutocomplete = true
  searchQuery.value = normalized
  autocompleteSuggestions.value = []
  nextTick(() => searchInputRef.value?.focus())
}

const performAutocomplete = async (query: string) => {
  const trimmed = query.trim()
  const requestId = ++autocompleteRequestId

  if (!trimmed) {
    console.debug('[Search][Autocomplete] skip: empty query')
    autocompleteSuggestions.value = []
    return
  }

  try {
    const url = new URL(AUTOCOMPLETE_ENDPOINT)
    url.searchParams.set('client_id', AUTOCOMPLETE_CLIENT_ID)
    url.searchParams.set('query', trimmed)
    url.searchParams.set('hits_per_page', '6')

    console.debug('[Search][Autocomplete] request', { url: url.toString() })
    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('[Search][Autocomplete] response error', {
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`Autocomplete failed with status ${response.status}`)
    }

    const data = (await response.json()) as { suggestions?: { text?: string }[] }

    if (requestId !== autocompleteRequestId) {
      console.debug('[Search][Autocomplete] stale response ignored', {
        requestId,
        latestRequestId: autocompleteRequestId
      })
      return
    }

    autocompleteSuggestions.value =
      data.suggestions?.map((suggestion) => suggestion.text?.trim())
        .filter((text): text is string => Boolean(text))
        .slice(0, 6) ?? []
    console.debug('[Search][Autocomplete] results', {
      count: autocompleteSuggestions.value.length
    })
  } catch (error) {
    if (requestId !== autocompleteRequestId) {
      console.debug('[Search][Autocomplete] error ignored for stale request', {
        requestId,
        latestRequestId: autocompleteRequestId
      })
      return
    }
    console.error('Failed to fetch autocomplete suggestions', error)
    autocompleteSuggestions.value = []
  }
}

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') {
    return
  }

  if (isOverlayOpen.value) {
    event.preventDefault()
    closeOverlay()
    return
  }

  if (isMobileMenuOpen.value) {
    event.preventDefault()
    closeMobileMenu()
  }
}

const initializeFromRouteQuery = () => {
  const param = route.query?.search
  const value = Array.isArray(param) ? param?.[0] : param

  if (typeof value === 'string' && value.trim()) {
    openOverlay()
    searchQuery.value = value
  }
}

onMounted(() => {
  updateOverlayOffset()
  handleResize()
  window.addEventListener('resize', updateOverlayOffset, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
  window.addEventListener('keydown', handleGlobalKeydown)
  initializeFromRouteQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateOverlayOffset)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleGlobalKeydown)

  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
    debounceTimeout = null
  }
})
</script>

<style scoped>
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>

<style scoped>
.range-input {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  pointer-events: none;
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 9999px;
  border: 2px solid #5d63ec;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  margin-top: -5px; /* pull thumb to the center of the custom track */
}
.range-input::-moz-range-thumb {
  height: 18px;
  width: 18px;
  border-radius: 9999px;
  border: 2px solid #5d63ec;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
}
.range-input::-webkit-slider-runnable-track {
  height: 8px;
}
.range-input::-moz-range-track {
  height: 8px;
}
</style>

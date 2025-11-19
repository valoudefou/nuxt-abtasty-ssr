<template>
  <div>
    <header ref="headerRef" class="fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur">
      <nav class="mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">
        <NuxtLink to="/" class="flex flex-1 items-center gap-2 text-xl font-semibold text-primary-600">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <ShoppingBagIcon class="h-6 w-6" />
          </span>
          Commerce Demo
        </NuxtLink>
        <div class="flex flex-1 items-center justify-center gap-8 text-sm font-medium text-slate-600">
          <NuxtLink v-for="item in navigation" :key="item.href" :to="item.href" class="hover:text-primary-600">
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
          <NuxtLink to="/cart" class="relative inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md">
            <ShoppingCartIcon class="mr-2 h-5 w-5" />
            Cart
            <span
              v-if="totalItems"
              class="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-primary-600"
            >
              {{ totalItems }}
            </span>
          </NuxtLink>
        </div>
      </nav>
    </header>

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
        class="fixed inset-x-0 bottom-0 z-50 overflow-y-auto border-t border-slate-200 bg-white/95 backdrop-blur"
        :style="{ top: overlayOffset }"
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
              <div
                v-if="autocompleteSuggestions.length"
                class="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl border border-slate-200 bg-white/95 shadow-xl"
              >
                <ul>
                  <li v-for="suggestion in autocompleteSuggestions" :key="suggestion">
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-primary-50 hover:text-primary-700"
                      @mousedown.prevent
                      @click="applySuggestion(suggestion)"
                    >
                      <MagnifyingGlassIcon class="h-4 w-4 text-slate-400" />
                      <span>{{ suggestion }}</span>
                    </button>
                  </li>
                </ul>
              </div>
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
              <aside class="sticky top-6 flex flex-col gap-6 lg:w-64 self-start">
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
                      v-if="selectedPriceRange"
                      type="button"
                      class="text-xs font-semibold text-primary-600 hover:text-primary-500"
                      @click="togglePriceRange(selectedPriceRange)"
                    >
                      Clear
                    </button>
                  </div>
                  <div class="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-3">
                    <button
                      v-for="range in priceRanges"
                      :key="range.value"
                      type="button"
                      class="w-full rounded-full px-4 py-2 text-sm font-medium transition"
                      :class="
                        selectedPriceRange === range.value
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-slate-600 hover:bg-slate-100'
                      "
                      @click="togglePriceRange(range.value)"
                    >
                      {{ range.label }}
                    </button>
                  </div>
                </div>
              </aside>
              <div class="flex-1">
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
                <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <article
                    v-for="product in searchResults"
                    :key="product.id"
                    class="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <img :src="product.image" :alt="product.name" class="h-48 w-full rounded-xl object-cover" />
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
                    <NuxtLink
                      :to="product.link"
                      class="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                      @click="closeOverlay"
                    >
                      View product
                    </NuxtLink>
                  </article>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MagnifyingGlassIcon, ShoppingBagIcon, ShoppingCartIcon, XMarkIcon } from '@heroicons/vue/24/solid'

interface ApiSearchHit {
  id: number | string
  name: string
  img_link?: string
  link?: string
  price?: number | string | null
  brand?: string | null
}

interface ApiFacetResponse {
  brand?: {
    values?: [string, number][]
  }
}

interface ApiSearchResponse {
  hits?: ApiSearchHit[]
  facets?: ApiFacetResponse
}

interface SearchHit {
  id: string
  name: string
  image: string
  link: string
  price: number | null
  brand: string | null
}

interface PriceRange {
  label: string
  min?: number
  max?: number
  value: string
}

const SEARCH_ENDPOINT = 'https://search-api.abtasty.com/search'
const SEARCH_INDEX = '47c5c9b4ee0a19c9859f47734c1e8200_Catalog'
const AUTOCOMPLETE_ENDPOINT = 'https://search-api.abtasty.com/autocomplete'
const AUTOCOMPLETE_CLIENT_ID = '47c5c9b4ee0a19c9859f47734c1e8200'
const FALLBACK_IMAGE = 'https://assets-manager.abtasty.com/placeholder.png'

const { totalItems } = useCart()

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'About', href: '/about' },
  { label: 'Journal', href: '/journal' }
]

const headerRef = ref<HTMLElement | null>(null)
const overlayOffset = ref('4.5rem')
const searchInputRef = ref<HTMLInputElement | null>(null)
const isOverlayOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchHit[]>([])
const searchError = ref('')
const isSearching = ref(false)
const brandOptions = ref<string[]>([])
const selectedBrand = ref<string | null>(null)
const selectedPriceRange = ref<string | null>(null)
const autocompleteSuggestions = ref<string[]>([])

const hasMinimumQuery = computed(() => searchQuery.value.trim().length >= 2)
const priceRanges: PriceRange[] = [
  { label: 'Under $25', value: 'under-25', max: 25 },
  { label: '$25 to $50', value: '25-50', min: 25, max: 50 },
  { label: '$50 to $100', value: '50-100', min: 50, max: 100 },
  { label: '$100 to $250', value: '100-250', min: 100, max: 250 },
  { label: '$250+', value: 'over-250', min: 250 }
]
const selectedPriceConfig = computed(
  () => priceRanges.find((range) => range.value === selectedPriceRange.value) ?? null
)

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
})

const formatPrice = (value: number) => currencyFormatter.format(value)

const normalizePrice = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const normalizeHit = (hit: ApiSearchHit): SearchHit => ({
  id: String(hit.id),
  name: hit.name,
  image: hit.img_link || FALLBACK_IMAGE,
  link: hit.link || `/products/${hit.id}`,
  price: normalizePrice(hit.price),
  brand: hit.brand?.trim() || null
})

let latestRequestId = 0
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
let autocompleteRequestId = 0
let suppressAutocomplete = false

const performSearch = async (query: string) => {
  const trimmed = query.trim()
  const requestId = ++latestRequestId

  if (trimmed.length < 2) {
    searchResults.value = []
    searchError.value = ''
    isSearching.value = false
    return
  }

  isSearching.value = true
  searchError.value = ''

  try {
    const url = new URL(SEARCH_ENDPOINT)
    url.searchParams.set('index', SEARCH_INDEX)
    url.searchParams.set('text', trimmed)

    if (selectedBrand.value) {
      url.searchParams.append('filters[brand][]', selectedBrand.value)
    }
    const priceConfig = selectedPriceConfig.value
    if (priceConfig?.min !== undefined) {
      url.searchParams.append('filters[price][0][operator]', '>')
      url.searchParams.append('filters[price][0][value]', String(priceConfig.min))
    }
    if (priceConfig?.max !== undefined) {
      const index = priceConfig.min !== undefined ? 1 : 0
      url.searchParams.append(`filters[price][${index}][operator]`, '<')
      url.searchParams.append(`filters[price][${index}][value]`, String(priceConfig.max))
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`)
    }

    const data = (await response.json()) as ApiSearchResponse

    if (requestId !== latestRequestId) {
      return
    }

    const normalizedHits = (data.hits ?? []).map(normalizeHit)
    searchResults.value = normalizedHits

    const brandsFromHits = Array.from(
      new Set(
        normalizedHits
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
  } catch (error) {
    if (requestId !== latestRequestId) {
      return
    }
    console.error('Failed to search products from header search', error)
    searchError.value = 'We were unable to search products right now.'
    searchResults.value = []
  } finally {
    if (requestId === latestRequestId) {
      isSearching.value = false
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

const updateOverlayOffset = () => {
  const height = headerRef.value?.getBoundingClientRect().height
  overlayOffset.value = height ? `${height}px` : '4.5rem'
}

const openOverlay = () => {
  isOverlayOpen.value = true
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  searchError.value = ''
  isSearching.value = false
  selectedBrand.value = null
  selectedPriceRange.value = null
  brandOptions.value = []
  autocompleteSuggestions.value = []
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
  selectedPriceRange.value = null
  autocompleteSuggestions.value = []
}

const toggleBrandFilter = (brand: string) => {
  const normalized = brand.trim()

  if (!normalized) {
    return
  }

  selectedBrand.value = selectedBrand.value === normalized ? null : normalized

  if (hasMinimumQuery.value) {
    performSearch(searchQuery.value)
  }
}

const clearBrandFilter = () => {
  if (!selectedBrand.value) {
    return
  }

  selectedBrand.value = null

  if (hasMinimumQuery.value) {
    performSearch(searchQuery.value)
  }
}

const togglePriceRange = (value: string) => {
  selectedPriceRange.value = selectedPriceRange.value === value ? null : value

  if (hasMinimumQuery.value) {
    performSearch(searchQuery.value)
  }
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
    autocompleteSuggestions.value = []
    return
  }

  try {
    const url = new URL(AUTOCOMPLETE_ENDPOINT)
    url.searchParams.set('client_id', AUTOCOMPLETE_CLIENT_ID)
    url.searchParams.set('query', trimmed)
    url.searchParams.set('hits_per_page', '6')

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Autocomplete failed with status ${response.status}`)
    }

    const data = (await response.json()) as { suggestions?: { text?: string }[] }

    if (requestId !== autocompleteRequestId) {
      return
    }

    autocompleteSuggestions.value =
      data.suggestions?.map((suggestion) => suggestion.text?.trim())
        .filter((text): text is string => Boolean(text))
        .slice(0, 6) ?? []
  } catch (error) {
    if (requestId !== autocompleteRequestId) {
      return
    }
    console.error('Failed to fetch autocomplete suggestions', error)
    autocompleteSuggestions.value = []
  }
}

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOverlayOpen.value) {
    event.preventDefault()
    closeOverlay()
  }
}

onMounted(() => {
  updateOverlayOffset()
  window.addEventListener('resize', updateOverlayOffset, { passive: true })
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateOverlayOffset)
  window.removeEventListener('keydown', handleGlobalKeydown)

  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
    debounceTimeout = null
  }
})
</script>

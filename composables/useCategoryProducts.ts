import { computed } from 'vue'

import type { Product } from '@/types/product'

const PAGE_SIZE = 12

type PagedResponse = {
  products: Product[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  categories: string[]
  brands: string[]
  nextCursor?: string | null
}

export const useCategoryProducts = () => {
  const products = useState<Product[]>('category-products', () => [])
  const categories = useState<string[]>('product-categories', () => [])
  const brands = useState<string[]>('category-brands', () => [])
  const selectedCategory = useState<string>('selected-category', () => 'All')
  const selectedBrand = useState<string>('selected-brand', () => 'All')
  const searchQuery = useState<string>('category-search-query', () => '')
  const page = useState<number>('category-page', () => 1)
  const pageCursors = useState<Record<number, string>>('category-page-cursors', () => ({}))
  const pageCache = useState<Record<string, { response: PagedResponse; fetchedAt: number }>>(
    'category-page-cache',
    () => ({})
  )
  const includeFacetsNext = useState<boolean>('category-include-facets', () => true)
  const pageSize = PAGE_SIZE
  const total = useState<number>('category-total', () => 0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  const CACHE_TTL = 1000 * 30

  const fetchPagedProducts = async () => {
    const brandFilter = selectedBrand.value.trim() || 'All'
    const categoryFilter = selectedCategory.value.trim() || 'All'
    const cursor = page.value > 1 ? pageCursors.value[page.value] ?? '' : ''
    const queryValue = searchQuery.value || ''
    const cacheKey = [
      brandFilter.toLowerCase(),
      categoryFilter.toLowerCase(),
      queryValue.toLowerCase(),
      `page:${page.value}`,
      cursor ? `cursor:${cursor}` : ''
    ].filter(Boolean).join('|')

    const cached = pageCache.value[cacheKey]
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      const cachedResponse = cached.response
      const brandTarget = brandFilter === 'All' ? null : brandFilter.toLowerCase()
      products.value = brandTarget
        ? cachedResponse.products.filter((product) => product.brand?.toLowerCase() === brandTarget)
        : cachedResponse.products
      if (cachedResponse.categories?.length) {
        categories.value = cachedResponse.categories
      }
      if (cachedResponse.brands?.length) {
        brands.value = cachedResponse.brands
      }
      total.value = cachedResponse.total
      page.value = cachedResponse.page
      if (cachedResponse.nextCursor) {
        pageCursors.value = { ...pageCursors.value, [page.value + 1]: cachedResponse.nextCursor }
      }
      return
    }
    let response: PagedResponse | null = null
    let attempt = 0

    while (attempt < 2) {
      try {
        const params: Record<string, string | number | undefined> = {
          page: page.value,
          pageSize,
          brand: brandFilter,
          category: categoryFilter,
          q: queryValue || undefined,
          includeFacets: includeFacetsNext.value ? '1' : '0'
        }

        if (cursor) {
          params.cursor = cursor
        }

        response = await $fetch<PagedResponse>('/api/products/paged', {
          params
        })
        break
      } catch (err) {
        const status = (err as { statusCode?: number; response?: { status?: number } })?.statusCode
          ?? (err as { response?: { status?: number } })?.response?.status
        const retryAfterHeader = (err as { response?: { headers?: { get?: (key: string) => string | null } } })
          ?.response?.headers?.get?.('retry-after')
        const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : Number.NaN

        if (status === 429 && Number.isFinite(retryAfterSeconds) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000))
          attempt += 1
          continue
        }
        throw err
      }
    }

    if (!response) {
      throw new Error('Failed to load products.')
    }

    const brandTarget = brandFilter === 'All' ? null : brandFilter.toLowerCase()
    products.value = brandTarget
      ? response.products.filter((product) => product.brand?.toLowerCase() === brandTarget)
      : response.products
    if (response.categories?.length) {
      categories.value = response.categories
    }
    if (response.brands?.length) {
      brands.value = response.brands
    }
    total.value = response.total
    page.value = response.page
    if (response.nextCursor) {
      pageCursors.value = { ...pageCursors.value, [page.value + 1]: response.nextCursor }
    }
    pageCache.value = { ...pageCache.value, [cacheKey]: { response, fetchedAt: Date.now() } }
    includeFacetsNext.value = false

    if (response.products.length === 0) {
      error.value =
        selectedCategory.value === 'All'
          ? 'No products available for the current filters.'
          : `No products found in the "${selectedCategory.value}" category.`
    }
  }

  const fetchProducts = async () => {
    loading.value = true
    error.value = null

    try {
      await fetchPagedProducts()
    } catch (err) {
      console.error('Failed to load products for categories view', err)
      error.value = 'We were unable to load products. Please try again later.'
    } finally {
      loading.value = false
    }
  }

  const selectCategory = async (category: string) => {
    selectedCategory.value = category
    error.value = null
    page.value = 1
    pageCursors.value = {}
    pageCache.value = {}
    includeFacetsNext.value = true

    await fetchProducts()
  }

  const selectBrand = async (brand: string) => {
    selectedBrand.value = brand
    error.value = null
    page.value = 1
    selectedCategory.value = 'All'
    pageCursors.value = {}
    pageCache.value = {}
    includeFacetsNext.value = true

    await fetchProducts()
  }

  const searchProducts = async (query: string) => {
    const trimmed = query.trim()
    searchQuery.value = trimmed
    error.value = null
    page.value = 1
    pageCursors.value = {}
    pageCache.value = {}
    includeFacetsNext.value = true
    await fetchProducts()
  }

  const goToPage = async (nextPage: number) => {
    page.value = nextPage

    await fetchProducts()
  }

  return {
    products,
    categories,
    brands,
    selectedCategory,
    selectedBrand,
    searchQuery,
    page,
    totalPages,
    loading,
    error,
    fetchProducts,
    selectCategory,
    selectBrand,
    searchProducts,
    goToPage
  }
}

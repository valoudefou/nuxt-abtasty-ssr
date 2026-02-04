import { computed } from 'vue'

import type { Product } from '@/types/product'

const PAGE_SIZE = 12

type PagedResponse = {
  products: Product[]
  page: number
  pageSize: number
  totalPages: number
  categories: string[]
  brands: string[]
  nextCursor?: string | null
  next_cursor?: string | null
}

export const useCategoryProducts = () => {
  const route = useRoute()
  const activeVendor = useState<string>('active-vendor', () => '')
  const products = useState<Product[]>('category-products', () => [])
  const categories = useState<string[]>('product-categories', () => [])
  const brands = useState<string[]>('category-brands', () => [])
  const selectedCategory = useState<string>('selected-category', () => 'All')
  const selectedBrand = useState<string>('selected-brand', () => 'All')
  const searchQuery = useState<string>('category-search-query', () => '')
  const page = useState<number>('category-page', () => 1)
  const nextCursorByFilter = useState<Record<string, string | null>>('category-next-cursor', () => ({}))
  const pageCache = useState<Record<string, { response: PagedResponse; fetchedAt: number }>>(
    'category-page-cache',
    () => ({})
  )
  const includeFacetsNext = useState<boolean>('category-include-facets', () => true)
  const pageSize = PAGE_SIZE
  const totalPages = useState<number>('category-total-pages', () => 1)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const CACHE_TTL = 1000 * 30

  const buildFilterKey = (brandFilter: string, categoryFilter: string, queryValue: string) =>
    [
      brandFilter.toLowerCase(),
      categoryFilter.toLowerCase(),
      queryValue.toLowerCase()
    ].join('|')

  const mergeProducts = (existing: Product[], incoming: Product[]) => {
    const seen = new Set(existing.map((product) => product.id))
    const merged = [...existing]
    for (const product of incoming) {
      if (!seen.has(product.id)) {
        merged.push(product)
      }
    }
    return merged
  }

  const getNextCursor = (response: PagedResponse) => response.nextCursor ?? response.next_cursor ?? null

  const canLoadMore = computed(() => {
    const brandFilter = selectedBrand.value.trim() || 'All'
    const categoryFilter = selectedCategory.value.trim() || 'All'
    const queryValue = searchQuery.value || ''
    const filterKey = buildFilterKey(brandFilter, categoryFilter, queryValue)
    const cursor = nextCursorByFilter.value[filterKey]
    return Boolean(cursor)
  })

  const fetchPagedProducts = async (options: { append?: boolean } = {}) => {
    const append = Boolean(options.append)
    const brandFilter = selectedBrand.value.trim() || 'All'
    const categoryFilter = selectedCategory.value.trim() || 'All'
    const queryValue = searchQuery.value || ''
    const filterKey = buildFilterKey(brandFilter, categoryFilter, queryValue)
    const cursor = append ? nextCursorByFilter.value[filterKey] ?? '' : ''
    const requestPage = append ? page.value + 1 : 1
    const routeVendor =
      typeof route.params.companyId === 'string' ? route.params.companyId.trim() : ''
    const vendorId = routeVendor || activeVendor.value?.trim() || ''

    const cacheKey = [
      filterKey,
      `page:${requestPage}`,
      cursor ? `cursor:${cursor}` : ''
    ].filter(Boolean).join('|')

    const cached = pageCache.value[cacheKey]
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      const cachedResponse = cached.response
      const brandTarget = brandFilter === 'All' ? null : brandFilter.toLowerCase()
      const filteredProducts = brandTarget
        ? cachedResponse.products.filter((product) => product.brand?.toLowerCase() === brandTarget)
        : cachedResponse.products
      products.value = append ? mergeProducts(products.value, filteredProducts) : filteredProducts
      if (cachedResponse.categories?.length) {
        categories.value = cachedResponse.categories
      }
      if (cachedResponse.brands?.length) {
        brands.value = cachedResponse.brands
      }
      const cachedNextCursor = getNextCursor(cachedResponse)
      totalPages.value = cachedResponse.totalPages
      page.value = requestPage
      nextCursorByFilter.value = {
        ...nextCursorByFilter.value,
        [filterKey]: cachedNextCursor
      }
      return
    }
    let response: PagedResponse | null = null
    let attempt = 0

    while (attempt < 2) {
      try {
        const params: Record<string, string | number | undefined> = {
          page: requestPage,
          pageSize,
          brandId: brandFilter,
          categoryId: categoryFilter,
          q: queryValue || undefined,
          includeFacets: includeFacetsNext.value ? '1' : '0',
          vendorId: vendorId || undefined
        }

        if (cursor) {
          params.cursor = cursor
        }

        response = await $fetch<PagedResponse>('/api/products/paged', {
          params,
          // Avoid sending potentially huge third-party cookies (AB Tasty / Klaviyo, etc.)
          // which can cause 413/headers-too-large errors on Vercel.
          credentials: 'omit'
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
    const filteredProducts = brandTarget
      ? response.products.filter((product) => product.brand?.toLowerCase() === brandTarget)
      : response.products
    products.value = append ? mergeProducts(products.value, filteredProducts) : filteredProducts
    if (response.categories?.length) {
      categories.value = response.categories
    }
    if (response.brands?.length) {
      brands.value = response.brands
    }
    const nextCursor = getNextCursor(response)
    totalPages.value = response.totalPages
    page.value = requestPage
    nextCursorByFilter.value = {
      ...nextCursorByFilter.value,
      [filterKey]: nextCursor
    }
    pageCache.value = { ...pageCache.value, [cacheKey]: { response, fetchedAt: Date.now() } }
    includeFacetsNext.value = false

    if (!append && response.products.length === 0) {
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
    pageCache.value = {}
    includeFacetsNext.value = true

    await fetchProducts()
  }

  const selectBrand = async (brand: string) => {
    selectedBrand.value = brand
    error.value = null
    page.value = 1
    selectedCategory.value = 'All'
    pageCache.value = {}
    includeFacetsNext.value = true

    await fetchProducts()
  }

  const applyAffinity = async (category: string | null, brand: string | null) => {
    selectedCategory.value = category?.trim() || 'All'
    selectedBrand.value = brand?.trim() || 'All'
    error.value = null
    page.value = 1
    pageCache.value = {}
    includeFacetsNext.value = true

    await fetchProducts()
  }

  const searchProducts = async (query: string) => {
    const trimmed = query.trim()
    searchQuery.value = trimmed
    error.value = null
    page.value = 1
    pageCache.value = {}
    includeFacetsNext.value = true
    await fetchProducts()
  }

  const loadMore = async () => {
    if (!canLoadMore.value || loading.value) {
      return
    }

    loading.value = true
    error.value = null
    try {
      await fetchPagedProducts({ append: true })
    } catch (err) {
      console.error('Failed to load more products for categories view', err)
      error.value = 'We were unable to load more products. Please try again later.'
    } finally {
      loading.value = false
    }
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
    canLoadMore,
    loading,
    error,
    fetchProducts,
    selectCategory,
    selectBrand,
    applyAffinity,
    searchProducts,
    loadMore
  }
}

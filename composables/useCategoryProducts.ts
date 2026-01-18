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
}

const getProductCategories = (product: Product) => {
  const unique = new Map<string, string>()
  const addCategory = (value?: string | null) => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (!unique.has(key)) {
      unique.set(key, trimmed)
    }
  }

  addCategory(product.category)
  addCategory(product.category_level2)
  addCategory(product.category_level3)
  addCategory(product.category_level4)

  return Array.from(unique.values())
}

const matchesCategory = (product: Product, category: string) => {
  if (category === 'All') {
    return true
  }

  const target = category.toLowerCase()
  return getProductCategories(product).some((value) => value.toLowerCase() === target)
}

const deriveCategories = (collection: Product[], activeCategory: string) => {
  const unique = new Map<string, string>()
  const source =
    activeCategory === 'All'
      ? collection
      : collection.filter((item) => matchesCategory(item, activeCategory))

  for (const item of source) {
    for (const category of getProductCategories(item)) {
      const key = category.toLowerCase()
      if (!unique.has(key)) {
        unique.set(key, category)
      }
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b))
}

const filterByCategory = (collection: Product[], category: string) => {
  if (category === 'All') {
    return collection
  }

  return collection.filter((product) => matchesCategory(product, category))
}

const deriveBrands = (collection: Product[]) => {
  const unique = new Set<string>()
  for (const item of collection) {
    if (item.brand) {
      unique.add(item.brand)
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b))
}

const filterByBrand = (collection: Product[], brand: string) => {
  if (brand === 'All') {
    return collection
  }

  const target = brand.toLowerCase()
  return collection.filter((product) => product.brand?.toLowerCase() === target)
}

export const useCategoryProducts = () => {
  const products = useState<Product[]>('category-products', () => [])
  const categories = useState<string[]>('product-categories', () => [])
  const brands = useState<string[]>('category-brands', () => [])
  const brandsLoaded = useState<boolean>('category-brands-loaded', () => false)
  const selectedCategory = useState<string>('selected-category', () => 'All')
  const selectedBrand = useState<string>('selected-brand', () => 'All')
  const searchQuery = useState<string>('category-search-query', () => '')
  const searchResults = useState<Product[]>('category-search-results', () => [])
  const page = useState<number>('category-page', () => 1)
  const pageSize = PAGE_SIZE
  const total = useState<number>('category-total', () => 0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

  const refreshCategories = (collection: Product[]) => {
    const derived = deriveCategories(collection, selectedCategory.value)
    categories.value = derived
    if (selectedCategory.value !== 'All' && !derived.includes(selectedCategory.value)) {
      selectedCategory.value = 'All'
    }
  }

  const applyPagedResults = (collection: Product[]) => {
    const categoryFiltered = filterByCategory(collection, selectedCategory.value)
    const totalMatches = categoryFiltered.length

    total.value = totalMatches
    const clampedPage = Math.min(Math.max(page.value, 1), Math.max(1, Math.ceil(totalMatches / pageSize)))
    page.value = clampedPage
    const start = (clampedPage - 1) * pageSize
    products.value = categoryFiltered.slice(start, start + pageSize)

    refreshCategories(collection)

    if (categoryFiltered.length === 0) {
      error.value =
        selectedCategory.value === 'All'
          ? 'No products available for the current filters.'
          : `No products found in the "${selectedCategory.value}" category.`
    }
  }

  const applySearchFilters = () => {
    const baseCollection = searchResults.value
    const brandFiltered = filterByBrand(baseCollection, selectedBrand.value)
    applyPagedResults(brandFiltered)
  }

  const fetchBrands = async () => {
    if (brandsLoaded.value) {
      return
    }

    const response = await $fetch<string[] | { brands: string[] }>('/api/products/brands')
    const normalized = Array.isArray(response) ? response : response.brands ?? []
    brands.value = normalized.filter(Boolean).map((brand) => String(brand).trim())
    brandsLoaded.value = true
  }

  const fetchBrandProducts = async (brand: string) => {
    const response = await $fetch<{ products: Product[] }>(`/api/products/brand/${encodeURIComponent(brand)}`)
    return response.products
  }

  const fetchCategoryProducts = async (category: string) => {
    const response = await $fetch<{ products: Product[] }>(`/api/products/category/${encodeURIComponent(category)}`)
    return response.products
  }

  const fetchPagedProducts = async () => {
    const response = await $fetch<PagedResponse>('/api/products/paged', {
      params: {
        page: page.value,
        pageSize,
        brand: selectedBrand.value,
        category: selectedCategory.value
      }
    })

    products.value = response.products
    categories.value = response.categories
    total.value = response.total
    page.value = response.page

    if (response.products.length === 0) {
      error.value =
        selectedCategory.value === 'All'
          ? 'No products available for the current filters.'
          : `No products found in the "${selectedCategory.value}" category.`
    }
  }

  const fetchSearchResults = async (query: string) => {
    const response = await $fetch<Product[] | { products: Product[] }>('/api/products/search', {
      params: { q: query }
    })

    searchResults.value = Array.isArray(response) ? response : response.products ?? []
  }

  const fetchProducts = async () => {
    loading.value = true
    error.value = null

    try {
      await fetchBrands()

      if (searchQuery.value) {
        await fetchSearchResults(searchQuery.value)
        applySearchFilters()
        return
      }

      searchResults.value = []

      if (selectedBrand.value !== 'All') {
        const brandProducts = await fetchBrandProducts(selectedBrand.value)
        if (brandProducts.length === 0) {
          selectedBrand.value = 'All'
          await fetchPagedProducts()
          return
        }
        applyPagedResults(brandProducts)
        return
      }

      if (selectedCategory.value !== 'All') {
        const categoryProducts = await fetchCategoryProducts(selectedCategory.value)
        applyPagedResults(categoryProducts)
        return
      }

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

    if (searchQuery.value) {
      applySearchFilters()
      return
    }

    await fetchProducts()
  }

  const selectBrand = async (brand: string) => {
    selectedBrand.value = brand
    error.value = null
    page.value = 1
    selectedCategory.value = 'All'

    if (searchQuery.value) {
      applySearchFilters()
      return
    }

    await fetchProducts()
  }

  const searchProducts = async (query: string) => {
    const trimmed = query.trim()
    searchQuery.value = trimmed
    error.value = null
    page.value = 1

    await fetchProducts()
  }

  const goToPage = async (nextPage: number) => {
    page.value = nextPage

    if (searchQuery.value) {
      applySearchFilters()
      return
    }

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

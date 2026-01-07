import type { Product } from '@/types/product'

const getProductCategories = (product: Product) => {
  const unique = new Map<string, string>()
  const addCategory = (value?: string) => {
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
  const allProducts = useState<Product[]>('category-all-products', () => [])
  const categories = useState<string[]>('product-categories', () => [])
  const brands = useState<string[]>('category-brands', () => [])
  const selectedCategory = useState<string>('selected-category', () => 'All')
  const selectedBrand = useState<string>('selected-brand', () => 'All')
  const searchQuery = useState<string>('category-search-query', () => '')
  const searchResults = useState<Product[]>('category-search-results', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasFetched = useState<boolean>('category-has-fetched', () => false)

  const applyFilters = (collection: Product[]) => {
    const brandFiltered = filterByBrand(collection, selectedBrand.value)
    return filterByCategory(brandFiltered, selectedCategory.value)
  }

  const refreshCategories = (collection: Product[]) => {
    const brandScoped = selectedBrand.value === 'All' ? collection : filterByBrand(collection, selectedBrand.value)
    const derived = deriveCategories(brandScoped, selectedCategory.value)
    categories.value = derived
    if (selectedCategory.value !== 'All' && !derived.includes(selectedCategory.value)) {
      selectedCategory.value = 'All'
    }
  }

  const fetchProducts = async () => {
    if (hasFetched.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Product[]>('/api/products')
      allProducts.value = response
      products.value = response
      categories.value = deriveCategories(response, selectedCategory.value)
      brands.value = deriveBrands(response)
      selectedCategory.value = 'All'
      selectedBrand.value = 'All'
      searchQuery.value = ''
      searchResults.value = []
      refreshCategories(response)
      hasFetched.value = true
    } catch (err) {
      console.error('Failed to load products for categories view', err)
      error.value = 'We were unable to load products. Please try again later.'
    } finally {
      loading.value = false
    }
  }

  const selectCategory = (category: string) => {
    selectedCategory.value = category
    error.value = null

    const baseCollection = searchQuery.value ? searchResults.value : allProducts.value
    const filtered = applyFilters(baseCollection)
    products.value = filtered
    refreshCategories(baseCollection)

    if (filtered.length === 0) {
      error.value =
        category === 'All'
          ? 'No products available for the current search.'
          : `No products found in the "${category}" category.`
    }
  }

  const selectBrand = (brand: string) => {
    selectedBrand.value = brand
    error.value = null

    const baseCollection = searchQuery.value ? searchResults.value : allProducts.value
    refreshCategories(baseCollection)
    const filtered = applyFilters(baseCollection)
    products.value = filtered

    if (filtered.length === 0) {
      error.value =
        brand === 'All'
          ? 'No products available for the current filters.'
          : `No products from "${brand}" match the current filters.`
    }
  }

  const searchProducts = async (query: string) => {
    const trimmed = query.trim()
    searchQuery.value = trimmed
    error.value = null

    if (!trimmed) {
      searchResults.value = []
      refreshCategories(allProducts.value)
      selectCategory(selectedCategory.value)
      return
    }

    loading.value = true

    try {
      const response = await $fetch<{ products: Product[] }>('/api/products/search', {
        params: { q: trimmed }
      })

      searchResults.value = response.products
      refreshCategories(response.products)
      const filtered = applyFilters(response.products)
      products.value = filtered

      if (filtered.length === 0) {
        error.value =
          selectedCategory.value === 'All'
            ? `No products found for "${trimmed}".`
            : `No "${selectedCategory.value}" products match "${trimmed}".`
      }
    } catch (err) {
      console.error('Failed to search products for categories view', err)
      error.value = 'We were unable to search products right now.'
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
    loading,
    error,
    fetchProducts,
    selectCategory,
    selectBrand,
    searchProducts
  }
}

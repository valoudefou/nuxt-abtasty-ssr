import type { Product } from '@/types/product'

export const useProducts = () => {
  const products = useState<Product[]>('products', () => [])
  const allProducts = useState<Product[]>('all-products', () => [])
  const brands = useState<string[]>('product-brands', () => [])
  const selectedBrand = useState<string>('selected-brand', () => 'All')
  const searchQuery = useState<string>('product-search-query', () => '')
  const searchResults = useState<Product[]>('product-search-results', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasFetchedProducts = useState<boolean>('has-fetched-products', () => false)

  const filterByBrand = (collection: Product[], brand: string) => {
    if (brand === 'All') {
      return collection
    }

    const target = brand.toLowerCase()
    return collection.filter((product) => product.brand?.toLowerCase() === target)
  }

  const fetchProducts = async () => {
    if (hasFetchedProducts.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Product[] | { products: Product[] }>('/api/products')
      const normalized = Array.isArray(response) ? response : response.products ?? []
      products.value = normalized
      allProducts.value = normalized
      selectedBrand.value = 'All'
      searchQuery.value = ''
      searchResults.value = []
      hasFetchedProducts.value = true
    } catch (err) {
      error.value = 'We were unable to load products. Please try again later.'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const fetchBrands = async () => {
    if (brands.value.length > 0) {
      return
    }

    try {
      const response = await $fetch<{ brands: string[] }>('/api/products/brands')
      brands.value = [...response.brands].sort((a, b) => a.localeCompare(b))
    } catch (err) {
      console.error('Failed to load product brands', err)
    }
  }

  const selectBrand = async (brand: string) => {
    selectedBrand.value = brand
    error.value = null

    if (searchQuery.value) {
      const baseCollection = searchResults.value
      const filtered = filterByBrand(baseCollection, brand)

      products.value = filtered

      if (filtered.length === 0) {
        error.value =
          brand === 'All'
            ? `No products found for "${searchQuery.value}".`
            : `No products found for brand "${brand}" matching "${searchQuery.value}".`
      }

      loading.value = false
      return
    }

    if (brand === 'All') {
      products.value = allProducts.value
      loading.value = false
      return
    }

    loading.value = true

    const brandName = brand.trim()

    if (!brandName) {
      products.value = []
      error.value = `No products found for brand "${brand}".`
      loading.value = false
      return
    }

    try {
      const response = await $fetch<{ products: Product[] }>(
        `/api/products/brand/${encodeURIComponent(brandName)}`
      )

      products.value = response.products
    } catch (err) {
      const status = (err as { status?: number; statusCode?: number })?.statusCode
        ?? (err as { status?: number })?.status

      if (status === 404) {
        const fallback = filterByBrand(allProducts.value, brand)
        products.value = fallback

        if (fallback.length === 0) {
          error.value = `No products found for brand "${brand}".`
        } else {
          error.value = null
        }
      } else {
        error.value = 'We were unable to load products. Please try again later.'
      }

      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const searchProducts = async (query: string) => {
    const trimmed = query.trim()
    searchQuery.value = trimmed
    error.value = null

    if (!trimmed) {
      searchResults.value = []

      if (selectedBrand.value === 'All') {
        products.value = allProducts.value
        loading.value = false
        return
      }

      await selectBrand(selectedBrand.value)
      return
    }

    loading.value = true

    try {
      const response = await $fetch<{ products: Product[] }>('/api/products/search', {
        params: { q: trimmed }
      })

      searchResults.value = response.products

      const filtered = filterByBrand(response.products, selectedBrand.value)
      products.value = filtered

      if (filtered.length === 0) {
        error.value =
          selectedBrand.value === 'All'
            ? `No products found for "${trimmed}".`
            : `No products found for brand "${selectedBrand.value}" matching "${trimmed}".`
      }
    } catch (err) {
      error.value = 'We were unable to search products right now.'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const extractNumericId = (value: string | number) => {
    if (typeof value === 'number') {
      return value
    }

    // Use the last numeric segment (e.g., "2016-ford-ranger-1589" -> 1589).
    const match = String(value).match(/(\d+)(?!.*\d)/)
    return match ? Number.parseInt(match[1], 10) : Number.NaN
  }

  const findById = async (id: string | number) => {
    const numericId = extractNumericId(id)

    if (!Number.isFinite(numericId)) {
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    }

    try {
      return await $fetch<Product>(`/api/products/${encodeURIComponent(String(numericId))}`)
    } catch (err) {
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    }
  }

  return {
    products,
    brands,
    selectedBrand,
    searchQuery,
    loading,
    error,
    fetchProducts,
    fetchBrands,
    selectBrand,
    searchProducts,
    findById
  }
}

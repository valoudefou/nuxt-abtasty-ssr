import type { Product } from '@/types/product'

const shuffleProducts = (items: Product[]) => {
  const array = [...items]

  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[array[index], array[swapIndex]] = [array[swapIndex], array[index]]
  }

  return array
}

export const useProducts = () => {
  const products = useState<Product[]>('products', () => [])
  const allProducts = useState<Product[]>('all-products', () => [])
  const brands = useState<string[]>('product-brands', () => [])
  const selectedBrand = useState<string>('selected-brand', () => 'All')
  const searchQuery = useState<string>('product-search-query', () => '')
  const searchResults = useState<Product[]>('product-search-results', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filterByBrand = (collection: Product[], brand: string) => {
    if (brand === 'All') {
      return collection
    }

    const target = brand.toLowerCase()
    return collection.filter((product) => product.brand?.toLowerCase() === target)
  }

  const fetchProducts = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Product[]>('/api/products')
      const randomized = shuffleProducts(response)
      products.value = randomized
      allProducts.value = randomized
      selectedBrand.value = 'All'
      searchQuery.value = ''
      searchResults.value = []
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

    try {
      const response = await $fetch<{ products: Product[] }>(
        `/api/products/brand/${encodeURIComponent(brand)}`
      )

      products.value = shuffleProducts(response.products)
    } catch (err) {
      const status = (err as { status?: number; statusCode?: number })?.statusCode
        ?? (err as { status?: number })?.status

      if (status === 404) {
        products.value = []
        error.value = `No products found for brand "${brand}".`
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

  const findBySlug = async (slug: string) => {
    try {
      return await $fetch<Product>(`/api/products/${slug}`)
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
    findBySlug
  }
}

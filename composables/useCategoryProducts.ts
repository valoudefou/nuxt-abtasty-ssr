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

export const useCategoryProducts = () => {
  const products = useState<Product[]>('category-products', () => [])
  const categories = useState<string[]>('product-categories', () => [])
  const brands = useState<string[]>('category-brands', () => [])
  const selectedCategory = useState<string>('selected-category', () => 'All')
  const selectedBrand = useState<string>('selected-brand', () => 'All')
  const searchQuery = useState<string>('category-search-query', () => '')
  const page = useState<number>('category-page', () => 1)
  const pageSize = PAGE_SIZE
  const total = useState<number>('category-total', () => 0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

  const fetchPagedProducts = async () => {
    const response = await $fetch<PagedResponse>('/api/products/paged', {
      params: {
        page: page.value,
        pageSize,
        brand: selectedBrand.value,
        category: selectedCategory.value,
        q: searchQuery.value || undefined
      }
    })

    products.value = response.products
    categories.value = response.categories ?? []
    brands.value = response.brands ?? []
    total.value = response.total
    page.value = response.page

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

      if (products.value.length === 0 && selectedBrand.value !== 'All') {
        selectedBrand.value = 'All'
        error.value = null
        await fetchPagedProducts()
      }
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

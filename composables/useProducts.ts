import type { Product } from '@/types/product'

export const useProducts = () => {
  const products = useState<Product[]>('products', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProducts = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Product[]>('/api/products')
      products.value = response
    } catch (err) {
      error.value = 'We were unable to load products. Please try again later.'
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
    loading,
    error,
    fetchProducts,
    findBySlug
  }
}

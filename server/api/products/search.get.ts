import { fetchProducts } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const term = typeof query.q === 'string' ? query.q.trim() : ''

  if (!term) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A search query is required.',
      data: { error: 'Missing q parameter for product search.' }
    })
  }

  const products = await fetchProducts()
  const normalizedTerm = term.toLowerCase()

  return {
    products: products.filter((product) => {
      const fields = [
        product.name,
        product.description,
        product.brand,
        product.category,
        product.category_level2,
        product.category_level3,
        product.category_level4
      ]

      return fields.some((field) => field?.toLowerCase().includes(normalizedTerm))
    })
  }
})

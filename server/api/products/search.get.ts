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

  const matches = products.filter((product) => {
    const fields = [product.name, product.description, product.brand, product.category]

    return fields.some((field) => {
      if (!field) return false
      return field.toLowerCase().includes(normalizedTerm)
    })
  })

  return {
    products: matches
  }
})

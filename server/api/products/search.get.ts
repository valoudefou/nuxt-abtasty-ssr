import { fetchProducts } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const term = typeof query.q === 'string' ? query.q.trim() : ''
  const requestStart = Date.now()

  if (!term) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A search query is required.',
      data: { error: 'Missing q parameter for product search.' }
    })
  }

  const products = await fetchProducts(event)
  const target = term.toLowerCase()
  const matches = products.filter((product) => {
    const title = product.title ?? product.name
    return title?.toLowerCase().includes(target)
  })

  console.info('[ProductsSearch]', {
    term,
    total: matches.length,
    durationMs: Date.now() - requestStart
  })

  return {
    products: matches
  }
})

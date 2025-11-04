import { products } from '@/data/products'

export default defineEventHandler((event) => {
  const { slug } = getRouterParams(event)
  const product = products.find((item) => item.slug === slug)

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return product
})

import { findProductById, findProductBySlug } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const product = (await findProductById(id, event)) ?? (await findProductBySlug(id, event))

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return product
})

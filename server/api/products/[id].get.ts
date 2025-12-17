import { findProductById, findProductBySlug } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const product = (await findProductById(id)) ?? (await findProductBySlug(id))

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return product
})

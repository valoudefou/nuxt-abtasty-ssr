import { fetchProducts } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  return await fetchProducts(event)
})

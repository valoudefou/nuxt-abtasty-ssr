import { fetchProductBrands } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const brands = await fetchProductBrands(event)

  return {
    brands
  }
})

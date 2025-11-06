import { fetchProductBrands } from '@/server/utils/products'

export default defineEventHandler(async () => {
  const brands = await fetchProductBrands()

  return {
    brands
  }
})

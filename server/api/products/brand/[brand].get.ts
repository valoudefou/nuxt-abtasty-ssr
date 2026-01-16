import { findProductsByBrand } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const { brand } = getRouterParams(event)

  if (!brand) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A brand parameter is required to filter products.'
    })
  }

  const products = await findProductsByBrand(brand)

  return {
    products
  }
})

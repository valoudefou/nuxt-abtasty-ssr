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

  if (products.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `No products found for brand "${brand}"`,
      data: { error: `No products found for brand "${brand}"` }
    })
  }

  return {
    products
  }
})

import { fetchProducts } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const { category } = getRouterParams(event)

  if (!category) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A category parameter is required to filter products.'
    })
  }

  const products = await fetchProducts()
  const target = category.toLowerCase()
  const matches = products.filter((product) => {
    const categories = [
      product.category,
      product.category_level2,
      product.category_level3,
      product.category_level4
    ]
      .filter(Boolean)
      .map((value) => value?.toLowerCase())

    return categories.includes(target)
  })

  if (matches.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `No products found in category "${category}"`,
      data: { error: `No products found in category "${category}"` }
    })
  }

  return {
    products: matches
  }
})

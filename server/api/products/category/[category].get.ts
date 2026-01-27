import type { Product } from '@/types/product'
import { fetchProducts } from '@/server/utils/products'

const getProductCategories = (product: Product) => {
  const unique = new Set<string>()
  const addCategory = (value?: string | null) => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return
    unique.add(trimmed.toLowerCase())
  }

  if (Array.isArray(product.categoryIds)) {
    for (const category of product.categoryIds) {
      addCategory(category)
    }
  }
  addCategory(product.category)
  addCategory(product.category_level2)
  addCategory(product.category_level3)
  addCategory(product.category_level4)

  return unique
}

export default defineEventHandler(async (event) => {
  const { category } = getRouterParams(event)

  if (!category) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A category parameter is required to filter products.'
    })
  }

  const decodedCategory = decodeURIComponent(category)
  const target = decodedCategory.toLowerCase()
  const products = await fetchProducts(event)
  const matches = products.filter((product) => getProductCategories(product).has(target))

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

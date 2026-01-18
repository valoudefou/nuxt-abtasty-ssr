import type { Product } from '@/types/product'
import { fetchProducts } from '@/server/utils/products'

const getProductCategories = (product: Product) => {
  const unique = new Set<string>()
  const addCategory = (value?: string | null) => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return
    unique.add(trimmed)
  }

  addCategory(product.category)
  addCategory(product.category_level2)
  addCategory(product.category_level3)
  addCategory(product.category_level4)

  return unique
}

export default defineEventHandler(async () => {
  const products = await fetchProducts()
  const unique = new Map<string, string>()
  for (const product of products) {
    for (const category of getProductCategories(product)) {
      const key = category.toLowerCase()
      if (!unique.has(key)) {
        unique.set(key, category)
      }
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b))
})

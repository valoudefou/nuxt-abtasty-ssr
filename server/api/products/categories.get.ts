import { fetchProducts } from '@/server/utils/products'

export default defineEventHandler(async () => {
  const products = await fetchProducts()
  const unique = new Set<string>()

  for (const product of products) {
    const fields = [
      product.category,
      product.category_level2,
      product.category_level3,
      product.category_level4
    ]

    for (const field of fields) {
      if (!field) continue
      const normalized = field.trim().toLowerCase()
      if (normalized) {
        unique.add(normalized)
      }
    }
  }

  return Array.from(unique)
})

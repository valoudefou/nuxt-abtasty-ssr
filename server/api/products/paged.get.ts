import type { Product } from '@/types/product'
import { fetchProducts } from '@/server/utils/products'

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 60

const normalizeParam = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const parseNumberParam = (value: unknown, fallback: number) => {
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }
  return fallback
}

const getProductCategories = (product: Product) => {
  const unique = new Map<string, string>()
  const addCategory = (value?: string) => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (!unique.has(key)) {
      unique.set(key, trimmed)
    }
  }

  addCategory(product.category)
  addCategory(product.category_level2)
  addCategory(product.category_level3)
  addCategory(product.category_level4)

  return Array.from(unique.values())
}

const matchesCategory = (product: Product, category: string) => {
  if (category === 'All') {
    return true
  }

  const target = category.toLowerCase()
  return getProductCategories(product).some((value) => value.toLowerCase() === target)
}

const deriveCategories = (collection: Product[], activeCategory: string) => {
  const unique = new Map<string, string>()
  const source =
    activeCategory === 'All'
      ? collection
      : collection.filter((item) => matchesCategory(item, activeCategory))

  for (const item of source) {
    for (const category of getProductCategories(item)) {
      const key = category.toLowerCase()
      if (!unique.has(key)) {
        unique.set(key, category)
      }
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b))
}

const deriveBrands = (collection: Product[]) => {
  const unique = new Set<string>()
  for (const item of collection) {
    if (item.brand) {
      unique.add(item.brand)
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b))
}

const matchesSearch = (product: Product, term: string) => {
  if (!term) return true
  const fields = [
    product.name,
    product.description,
    product.brand,
    product.category,
    product.category_level2,
    product.category_level3,
    product.category_level4
  ]

  return fields.some((field) => field?.toLowerCase().includes(term))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseNumberParam(query.page, 1)
  const pageSize = Math.min(parseNumberParam(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
  const category = normalizeParam(query.category) || 'All'
  const brand = normalizeParam(query.brand) || 'All'
  const term = normalizeParam(query.q).toLowerCase()

  const products = await fetchProducts()
  const searched = term ? products.filter((product) => matchesSearch(product, term)) : products
  const brandFiltered =
    brand === 'All'
      ? searched
      : searched.filter((product) => product.brand?.toLowerCase() === brand.toLowerCase())
  const categoryFiltered =
    category === 'All'
      ? brandFiltered
      : brandFiltered.filter((product) => matchesCategory(product, category))

  const total = categoryFiltered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const clampedPage = Math.min(Math.max(page, 1), totalPages)
  const start = (clampedPage - 1) * pageSize
  const paged = categoryFiltered.slice(start, start + pageSize)

  return {
    products: paged,
    page: clampedPage,
    pageSize,
    total,
    totalPages,
    categories: deriveCategories(brandFiltered, category),
    brands: deriveBrands(products)
  }
})

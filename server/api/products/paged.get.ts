import { setResponseHeader } from 'h3'
import { useRuntimeConfig } from '#imports'

import type { Product } from '@/types/product'
import type { RemoteResponse } from '@/server/utils/products'
import { fetchProducts, normalizeRemoteProduct } from '@/server/utils/products'

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

const deriveCategories = (collection: Product[]) => {
  const unique = new Map<string, string>()
  for (const item of collection) {
    const category = item.category?.trim()
    if (!category) continue
    const key = category.toLowerCase()
    if (!unique.has(key)) {
      unique.set(key, category)
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b))
}

const deriveBrands = (collection: Product[]) => {
  const unique = new Map<string, string>()
  for (const item of collection) {
    const brand = item.brand?.trim()
    if (!brand) continue
    const key = brand.toLowerCase()
    if (!unique.has(key)) {
      unique.set(key, brand)
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b))
}

const buildFallbackResponse = async (
  options: {
    page: number
    pageSize: number
    brand: string
    category: string
    vendor: string
    term: string
    includeFacets: boolean
  }
) => {
  const allProducts = await fetchProducts()
  const brandFilter = options.brand !== 'All' ? options.brand.toLowerCase() : null
  const categoryFilter = options.category !== 'All' ? options.category.toLowerCase() : null
  const vendorFilter = options.vendor ? options.vendor.toLowerCase() : null
  const termFilter = options.term ? options.term.toLowerCase() : null

  const filtered = allProducts.filter((product) => {
    if (brandFilter && product.brand?.toLowerCase() !== brandFilter) return false
    if (categoryFilter && product.category?.toLowerCase() !== categoryFilter) return false
    if (vendorFilter && product.vendor?.toLowerCase() !== vendorFilter) return false
    if (termFilter) {
      const haystack = `${product.title ?? ''} ${product.description ?? ''}`.toLowerCase()
      if (!haystack.includes(termFilter)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / options.pageSize))
  const startIndex = Math.max(0, (options.page - 1) * options.pageSize)
  const paged = filtered.slice(startIndex, startIndex + options.pageSize)
  const hasNext = startIndex + options.pageSize < filtered.length
  const nextCursor = hasNext ? `page:${options.page + 1}` : null

  const categories = options.includeFacets ? deriveCategories(filtered) : []
  const brands = options.includeFacets ? deriveBrands(filtered) : []

  return {
    products: paged,
    page: options.page,
    pageSize: options.pageSize,
    totalPages,
    nextCursor,
    next_cursor: nextCursor,
    categories,
    brands
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseNumberParam(query.page, 1)
  const pageSize = Math.min(parseNumberParam(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
  const category = normalizeParam(query.category) || 'All'
  const brand = normalizeParam(query.brand) || 'All'
  const vendor = normalizeParam(query.vendor)
  const term = normalizeParam(query.q)
  const cursor = normalizeParam(query.cursor)
  const cursorIsFallback = cursor.startsWith('page:')
  const includeFacets = normalizeParam(query.includeFacets)
  const shouldIncludeFacets = includeFacets !== '0' && includeFacets.toLowerCase() !== 'false'
  const fallbackPage = cursorIsFallback
    ? Number.parseInt(cursor.replace('page:', ''), 10)
    : page

  const config = useRuntimeConfig()
  const baseRaw = config.public?.apiBase || config.public?.productsApiBase || 'https://api.live-server1.com'
  const base = baseRaw.replace(/\/+$/, '')

  type RemotePagedResponse = RemoteResponse & { next_cursor?: string }
  let response: RemotePagedResponse | null = null

  if (cursorIsFallback) {
    return await buildFallbackResponse({
      page: Number.isFinite(fallbackPage) && fallbackPage > 0 ? fallbackPage : page,
      pageSize,
      brand,
      category,
      vendor,
      term,
      includeFacets: shouldIncludeFacets
    })
  }

  const params = {
    limit: pageSize,
    ...(cursor ? { cursor } : { page }),
    ...(brand !== 'All' ? { brand } : {}),
    ...(category !== 'All' ? { category } : {}),
    ...(vendor ? { vendor } : {}),
    ...(term ? { q: term } : {})
  }

  let attempt = 0
  let lastError: unknown = null

  while (attempt < 2) {
    try {
      response = await $fetch<RemotePagedResponse>(`${base}/products`, { params })
      lastError = null
      break
    } catch (error) {
      lastError = error
      const status = (error as { statusCode?: number; response?: { status?: number } })?.statusCode
        ?? (error as { response?: { status?: number } })?.response?.status
      if (status === 429 && attempt === 0) {
        const retryAfterHeader = (error as { response?: { headers?: { get?: (key: string) => string | null } } })
          ?.response?.headers?.get?.('retry-after')
        const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : Number.NaN
        if (Number.isFinite(retryAfterSeconds)) {
          setResponseHeader(event, 'retry-after', retryAfterSeconds)
          await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000))
        }
        attempt += 1
        continue
      }
      break
    }
  }

  if (!response) {
    console.error('Failed to load upstream products for paged request', lastError)
    return await buildFallbackResponse({
      page,
      pageSize,
      brand,
      category,
      vendor,
      term,
      includeFacets: shouldIncludeFacets
    })
  }

  const products = (response?.products ?? []).map(normalizeRemoteProduct)
  const hasNext = Boolean(response?.next_cursor)
  const totalPages = hasNext ? page + 1 : page

  const [categories, brands] = shouldIncludeFacets
    ? await Promise.all([
      brand !== 'All'
        ? Promise.resolve(deriveCategories(products))
        : $fetch<string[]>(`${base}/products/categories`).catch(() => []),
      $fetch<{ brands: string[] } | string[]>(`${base}/products/brands`)
        .then((payload) => (Array.isArray(payload) ? payload : payload.brands ?? []))
        .catch(() => [])
    ])
    : [[], []]

  return {
    products,
    page,
    pageSize,
    totalPages,
    nextCursor: response?.next_cursor ?? null,
    next_cursor: response?.next_cursor ?? null,
    categories: categories ?? [],
    brands: brands ?? []
  }
})

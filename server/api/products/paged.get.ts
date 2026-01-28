import { setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

import type { Product } from '@/types/product'
import type { RemoteResponse } from '@/server/utils/products'
import { fetchProducts, normalizeRemoteProduct } from '@/server/utils/products'
import { getSelectedVendor } from '@/server/utils/vendors'

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
  event: H3Event,
  options: {
    page: number
    pageSize: number
    brandId: string
    categoryId: string
    vendorId: string
    term: string
    includeFacets: boolean
  }
) => {
  const allProducts = await fetchProducts(event)
  const hasBrandData = allProducts.some((product) => Boolean(product.brand?.trim()))
  const hasVendorData = allProducts.some((product) => Boolean(product.vendor?.trim()))
  const brandFilter = hasBrandData && options.brandId !== 'All' ? options.brandId.toLowerCase() : null
  const categoryFilter = options.categoryId !== 'All' ? options.categoryId.toLowerCase() : null
  const vendorFilter = hasVendorData && options.vendorId ? options.vendorId.toLowerCase() : null
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
  const categoryId = normalizeParam(query.categoryId ?? query.category) || 'All'
  const brandId = normalizeParam(query.brandId ?? query.brand) || 'All'
  const vendorIdFromQuery = normalizeParam(query.vendorId ?? query.vendor)
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
  const disableRemote = Boolean(config.public?.productsDisableRemote)
  const vendorId = vendorIdFromQuery || (await getSelectedVendor(event))

  type RemotePagedResponse = RemoteResponse & { next_cursor?: string; nextCursor?: string }
  let response: RemotePagedResponse | null = null

  if (cursorIsFallback) {
    return await buildFallbackResponse(event, {
      page: Number.isFinite(fallbackPage) && fallbackPage > 0 ? fallbackPage : page,
      pageSize,
      brandId,
      categoryId,
      vendorId,
      term,
      includeFacets: shouldIncludeFacets
    })
  }

  if (disableRemote) {
    return await buildFallbackResponse(event, {
      page,
      pageSize,
      brandId,
      categoryId,
      vendorId,
      term,
      includeFacets: shouldIncludeFacets
    })
  }

  const params = {
    limit: pageSize,
    ...(cursor ? { cursor } : {}),
    ...(brandId !== 'All' ? { brandId } : {}),
    ...(categoryId !== 'All' ? { categoryId } : {}),
    ...(vendorId ? { vendorId } : {}),
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
    return await buildFallbackResponse(event, {
      page,
      pageSize,
      brandId,
      categoryId,
      vendorId,
      term,
      includeFacets: shouldIncludeFacets
    })
  }

  const products = (response?.data ?? response?.products ?? []).map(normalizeRemoteProduct)
  const nextCursor = response?.nextCursor ?? response?.next_cursor ?? null
  const hasNext = Boolean(nextCursor)
  const totalPages = hasNext ? page + 1 : page

  const [categories, brands] = shouldIncludeFacets
    ? await Promise.all([
      brandId !== 'All'
        ? Promise.resolve(deriveCategories(products))
        : $fetch<{ data?: Array<{ id?: string | null }> }>(`${base}/categories`, {
          params: vendorId ? { vendorId, limit: 100000 } : { limit: 100000 }
        })
          .then((payload) => (payload?.data ?? []).map((item) => String(item?.id ?? '').trim()).filter(Boolean))
          .catch(() => []),
      (vendorId
        ? $fetch<{ data?: Array<{ id?: string | null }> }>(
          `${base}/vendors/${encodeURIComponent(vendorId)}/brands`,
          { params: { limit: 100000 } }
        )
        : $fetch<{ data?: Array<{ id?: string | null }> }>(`${base}/brands`, {
          params: { limit: 100000 }
        }))
        .then((payload) => (payload?.data ?? []).map((item) => String(item?.id ?? '').trim()).filter(Boolean))
        .catch(() => [])
    ])
    : [[], []]

  return {
    products,
    page,
    pageSize,
    totalPages,
    nextCursor,
    next_cursor: nextCursor,
    categories: categories ?? [],
    brands: brands ?? []
  }
})

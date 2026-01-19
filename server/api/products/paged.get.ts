import { setResponseHeader } from 'h3'
import { useRuntimeConfig } from '#imports'

import type { Product } from '@/types/product'
import type { RemoteResponse } from '@/server/utils/products'
import { normalizeRemoteProduct } from '@/server/utils/products'

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


export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseNumberParam(query.page, 1)
  const pageSize = Math.min(parseNumberParam(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
  const category = normalizeParam(query.category) || 'All'
  const brand = normalizeParam(query.brand) || 'All'
  const vendor = normalizeParam(query.vendor)
  const term = normalizeParam(query.q)
  const cursor = normalizeParam(query.cursor)
  const includeFacets = normalizeParam(query.includeFacets)
  const shouldIncludeFacets = includeFacets !== '0' && includeFacets.toLowerCase() !== 'false'

  const config = useRuntimeConfig()
  const baseRaw = config.public?.productsApiBase || 'https://api.live-server1.com'
  const base = baseRaw.replace(/\/+$/, '')

  type RemotePagedResponse = RemoteResponse & { next_cursor?: string }
  let response: RemotePagedResponse

  try {
    response = await $fetch<RemotePagedResponse>(`${base}/products`, {
      params: {
        limit: pageSize,
        ...(cursor ? { cursor } : { page }),
        ...(brand !== 'All' ? { brand } : {}),
        ...(category !== 'All' ? { category } : {}),
        ...(vendor ? { vendor } : {}),
        ...(term ? { q: term } : {})
      }
    })
  } catch (error) {
    const status = (error as { statusCode?: number; response?: { status?: number } })?.statusCode
      ?? (error as { response?: { status?: number } })?.response?.status
    if (status === 429) {
      const retryAfterHeader = (error as { response?: { headers?: { get?: (key: string) => string | null } } })
        ?.response?.headers?.get?.('retry-after')
      if (retryAfterHeader) {
        const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10)
        if (Number.isFinite(retryAfterSeconds)) {
          setResponseHeader(event, 'retry-after', retryAfterSeconds)
        }
      }
      throw createError({ statusCode: 429, statusMessage: 'Rate limited' })
    }
    throw error
  }

  const products = (response?.products ?? []).map(normalizeRemoteProduct)
  const hasNext = Boolean(response?.next_cursor) || products.length === pageSize
  const totalPages = hasNext ? page + 1 : page
  const total = totalPages * pageSize

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
    total,
    totalPages,
    nextCursor: response?.next_cursor ?? null,
    categories: categories ?? [],
    brands: brands ?? []
  }
})

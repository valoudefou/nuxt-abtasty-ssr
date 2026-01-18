import { setResponseHeader } from 'h3'
import { useRuntimeConfig } from '#imports'

import type { RemoteResponse } from '@/server/utils/products'
import { normalizeRemoteProduct } from '@/server/utils/products'

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 60
const VENDOR_FILTER = 'karkkainen'

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

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseNumberParam(query.page, 1)
  const pageSize = Math.min(parseNumberParam(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
  const category = normalizeParam(query.category) || 'All'
  const brand = normalizeParam(query.brand) || 'All'
  const term = normalizeParam(query.q)
  const cursor = normalizeParam(query.cursor)

  const config = useRuntimeConfig()
  const baseRaw = config.public?.productsApiBase || 'https://api.live-server1.com'
  const base = baseRaw.replace(/\/+$/, '')

  type RemotePagedResponse = RemoteResponse & { next_cursor?: string }
  let response: RemotePagedResponse

  try {
    response = await $fetch<RemotePagedResponse>(`${base}/products`, {
      params: {
        limit: pageSize,
        vendor: VENDOR_FILTER,
        ...(cursor ? { cursor } : { page }),
        ...(brand !== 'All' ? { brand } : {}),
        ...(category !== 'All' ? { category } : {}),
        ...(term ? { q: term } : {})
      }
    })
  } catch (error) {
    const status = (error as { statusCode?: number; response?: { status?: number } })?.statusCode
      ?? (error as { response?: { status?: number } })?.response?.status
    if (status === 429) {
      const retryAfter = (error as { response?: { headers?: { get?: (key: string) => string | null } } })
        ?.response?.headers?.get?.('retry-after')
      if (retryAfter) {
        setResponseHeader(event, 'Retry-After', retryAfter)
      }
      throw createError({ statusCode: 429, statusMessage: 'Rate limited' })
    }
    throw error
  }

  const products = (response?.products ?? []).map(normalizeRemoteProduct)
  const hasNext = Boolean(response?.next_cursor) || products.length === pageSize
  const totalPages = hasNext ? page + 1 : page
  const total = totalPages * pageSize

  const [categories, brands] = await Promise.all([
    $fetch<string[]>(`${base}/products/categories`).catch(() => []),
    $fetch<{ brands: string[] } | string[]>(`${base}/products/brands`)
      .then((payload) => (Array.isArray(payload) ? payload : payload.brands ?? []))
      .catch(() => [])
  ])

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

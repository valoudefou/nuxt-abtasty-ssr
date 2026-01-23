import { createError, useRuntimeConfig } from '#imports'

import type { Product } from '@/types/product'
import type { RemoteProduct, RemoteResponse } from '@/server/utils/products'
import { normalizeRemoteProduct } from '@/server/utils/products'

const CACHE_TTL_MS = 1000 * 60 * 5
const PAGE_SIZE = 100
const MAX_PAGES = 20

type ValentinesCache = {
  products: Product[]
  fetchedAt: number
}

let cached: ValentinesCache | null = null

const normalizeResponse = (response: RemoteResponse | RemoteProduct[] | null): RemoteProduct[] => {
  if (!response) return []
  return Array.isArray(response) ? response : response.products ?? []
}

const normalizeBreadcrumbsText = (breadcrumbs?: RemoteProduct['breadcrumbs']) => {
  if (!breadcrumbs) return ''
  if (Array.isArray(breadcrumbs)) {
    return breadcrumbs.filter(Boolean).join(' ')
  }
  if (typeof breadcrumbs === 'string') {
    const trimmed = breadcrumbs.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean).join(' ')
        }
      } catch {
        // Fall back to raw string parsing below.
      }
    }
    return trimmed
  }
  return ''
}

const hasGiftBreadcrumb = (product: RemoteProduct) => {
  const text = normalizeBreadcrumbsText(product.breadcrumbs).toLowerCase()
  return text.includes('gift')
}

const getApiBase = () => {
  const config = useRuntimeConfig()
  const baseRaw = config.public?.apiBase || config.public?.productsApiBase || 'https://api.live-server1.com'
  return baseRaw.replace(/\/+$/, '')
}

export default defineEventHandler(async () => {
  const now = Date.now()
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  const base = getApiBase()
  const curated: Product[] = []

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await $fetch<RemoteResponse | RemoteProduct[]>(`${base}/products`, {
        params: { page, limit: PAGE_SIZE }
      })
      const batch = normalizeResponse(response)
      if (batch.length === 0) {
        break
      }

      const giftProducts = batch.filter(hasGiftBreadcrumb).map(normalizeRemoteProduct)
      curated.push(...giftProducts)

      if (batch.length < PAGE_SIZE) {
        break
      }
    }
  } catch (error) {
    if (cached) {
      return cached
    }
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to load Valentines Day products'
    })
  }

  cached = { products: curated, fetchedAt: now }
  return cached
})

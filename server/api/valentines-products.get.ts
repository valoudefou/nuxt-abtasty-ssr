import { createError, useRuntimeConfig } from '#imports'
import type { H3Event } from 'h3'

import type { Product } from '@/types/product'
import type { RemoteProduct, RemoteResponse } from '@/server/utils/products'
import { normalizeRemoteProduct } from '@/server/utils/products'
import { getSelectedVendor } from '@/server/utils/vendors'

const CACHE_TTL_MS = 1000 * 60
const PAGE_SIZE = 100
const MAX_PAGES = 20

type ValentinesCache = {
  products: Product[]
  fetchedAt: number
}

const cachedByVendor = new Map<string, ValentinesCache>()

const normalizeResponse = (response: RemoteResponse | RemoteProduct[] | null): RemoteProduct[] => {
  if (!response) return []
  return Array.isArray(response) ? response : response.data ?? response.products ?? []
}

const normalizeCategoryText = (...values: Array<RemoteProduct[keyof RemoteProduct]>) =>
  values
    .flat()
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' ')

const hasGiftCategory = (product: RemoteProduct) => {
  const text = normalizeCategoryText(
    product.category,
    product.category_level2,
    product.category_level3,
    product.category_level4,
    ...(product.categoryIds ?? [])
  ).toLowerCase()
  return text.includes('gift')
}

const getApiConfig = async (event: H3Event) => {
  const config = useRuntimeConfig()
  const baseRaw = config.public?.apiBase || config.public?.productsApiBase || 'https://api.live-server1.com'
  const base = baseRaw.replace(/\/+$/, '')
  const vendorId = await getSelectedVendor(event)
  return { base, vendorId }
}

export default defineEventHandler(async (event) => {
  const now = Date.now()
  const { base, vendorId } = await getApiConfig(event)
  const cached = cachedByVendor.get(vendorId)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }
  const curated: Product[] = []
  let cursor: string | null = null

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response: RemoteResponse | RemoteProduct[] = await $fetch(`${base}/products`, {
        params: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}), ...(vendorId ? { vendorId } : {}) }
      })
      const batch = normalizeResponse(response)
      if (batch.length === 0) {
        break
      }

      const giftProducts = batch
        .filter(hasGiftCategory)
        .map(normalizeRemoteProduct)
      curated.push(...giftProducts)

      const nextCursor: string | null = Array.isArray(response)
        ? null
        : response.nextCursor ?? response.next_cursor ?? null
      cursor = nextCursor
      if (!cursor) {
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

  const nextCache = { products: curated, fetchedAt: now }
  cachedByVendor.set(vendorId, nextCache)
  return nextCache
})

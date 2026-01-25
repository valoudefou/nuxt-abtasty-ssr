import { createError, useRuntimeConfig } from '#imports'

import type { Product } from '@/types/product'
import type { RemoteProduct, RemoteResponse } from '@/server/utils/products'
import { normalizeRemoteProduct } from '@/server/utils/products'

const CACHE_TTL_MS = 1000 * 60
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
    product.category_level4
  ).toLowerCase()
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

      const giftProducts = batch.filter(hasGiftCategory).map(normalizeRemoteProduct)
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

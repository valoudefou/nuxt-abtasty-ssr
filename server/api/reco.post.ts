import { createError } from '#imports'
import { useStorage } from 'nitropack/runtime'
import { getRequestHeader, readBody, setResponseHeader } from 'h3'

import { fetchRecommendations, type RecommendationResponse } from '@/server/utils/recommendations'

type RecommendationField =
  | 'brand'
  | 'homepage'
  | 'category'
  | 'category_level2'
  | 'category_level3'
  | 'category_level4'
  | 'cart_products'
  | 'viewed_items'

type RecommendationBody = {
  filterField?: RecommendationField
  filterValue?: string | number[] | number | null
  categoriesInCart?: string[] | string | null
  addedToCartProductId?: number | string | null
  viewingItemId?: number | string | null
  viewingItemSku?: string | number | null
  cartProductIds?: number[] | string | null
  clientId?: string | null
}

const normalizeArray = (value?: string[] | string | number[] | number | null) => {
  if (value === null || value === undefined) return undefined
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter((entry) => entry.trim().length > 0)
  }
  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean)
  }
  if (typeof value === 'number') {
    return [String(value)]
  }
  return undefined
}

const normalizeFilterField = (value?: string | null): RecommendationField => {
  if (value === 'category') return 'category'
  if (value === 'cart_products') return 'cart_products'
  if (value === 'viewed_items') return 'viewed_items'
  if (value === 'homepage') return 'homepage'
  return 'brand'
}

const cacheKeyFor = (payload: Record<string, unknown>) =>
  `reco:${Buffer.from(JSON.stringify(payload)).toString('base64url')}`

export default defineEventHandler(async (event) => {
  const body = await readBody<RecommendationBody>(event)

  const filterField = normalizeFilterField(body?.filterField ?? 'brand')
  const filterValue = body?.filterValue ?? null
  const categoriesInCart = normalizeArray(body?.categoriesInCart)
  const cartProductIds = normalizeArray(body?.cartProductIds)
  const addedToCartProductId =
    body?.addedToCartProductId !== undefined && body?.addedToCartProductId !== null
      ? Number(body.addedToCartProductId)
      : undefined
  const viewingItemId =
    body?.viewingItemId !== undefined && body?.viewingItemId !== null
      ? Number(body.viewingItemId)
      : undefined
  const viewingItemSku =
    body?.viewingItemSku !== undefined && body?.viewingItemSku !== null
      ? String(body.viewingItemSku).trim()
      : undefined

  if (!filterField) {
    throw createError({ statusCode: 400, statusMessage: 'Missing filterField' })
  }

  const cacheKey = cacheKeyFor({
    filterField,
    filterValue,
    categoriesInCart,
    cartProductIds,
    addedToCartProductId,
    viewingItemId,
    viewingItemSku,
    clientId: body?.clientId ?? null
  })

  const storage = useStorage('reco')
  const cached = await storage.getItem<{ payload: RecommendationResponse; expiresAt: number }>(cacheKey)
  const now = Date.now()

  if (cached && cached.expiresAt > now) {
    setResponseHeader(event, 'Cache-Control', 'private, max-age=0, stale-while-revalidate=60')
    setResponseHeader(event, 'X-Reco-Cache', 'HIT')
    return cached.payload
  }

  const normalizedFilterValue =
    filterField === 'cart_products' || filterField === 'viewed_items'
      ? normalizeArray(filterValue)?.map((entry) => Number(entry)).filter(Number.isFinite)
      : typeof filterValue === 'string'
        ? filterValue
        : typeof filterValue === 'number'
          ? String(filterValue)
          : undefined

  const payload = await fetchRecommendations({
    field: filterField,
    value: normalizedFilterValue,
    categoriesInCart: categoriesInCart?.length ? categoriesInCart : undefined,
    addedToCartProductId: Number.isFinite(addedToCartProductId) ? addedToCartProductId : undefined,
    viewingItemId: Number.isFinite(viewingItemId) ? viewingItemId : undefined,
    viewingItemSku: viewingItemSku || undefined,
    cartProductIds: cartProductIds?.length ? cartProductIds.map((id) => Number(id)).filter(Number.isFinite) : undefined
  })

  await storage.setItem(cacheKey, {
    payload,
    expiresAt: now + 1000 * 60
  })

  const origin = getRequestHeader(event, 'origin')
  if (origin) {
    setResponseHeader(event, 'Vary', 'Origin')
  }
  setResponseHeader(event, 'Cache-Control', 'private, max-age=0, stale-while-revalidate=60')
  setResponseHeader(event, 'X-Reco-Cache', 'MISS')
  return payload
})

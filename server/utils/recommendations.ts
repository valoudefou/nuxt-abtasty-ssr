import { createError, useRuntimeConfig } from '#imports'
import { getQuery, readBody } from 'h3'
import type { H3Event } from 'h3'

import type { Product } from '@/types/product'
import { fetchProducts, findProductById } from '@/server/utils/products'
import { getSelectedVendor } from '@/server/utils/vendors'
import { flagshipLogStore } from '@/utils/flagship/logStore'
import type { FlagshipLogLevel } from '@/utils/flagship/logStore'

type RawRecommendation = {
  id?: string | number
  sku?: string | number
  size?: string[] | string | number | null
  name?: string
  beforePrice?: string | number | null
  before_price?: string | number | null
  price?: string | number
  price_before_discount?: string | number | { amount?: string | number | null } | null
  discountPercentage?: string | number | null
  discount_percentage?: string | number | null
  discount_percent?: string | number | null
  img_link?: string
  link?: string
  absolute_link?: string
  description?: string
  brand?: string
}

export type RecommendationProduct = {
  id: string
  product: Product
  detailUrl?: string
  externalUrl?: string
  absoluteLink?: string
}

export type RecommendationResponse = {
  title: string
  items: RecommendationProduct[]
}

const PLACEHOLDER_IMAGE = 'https://assets-manager.abtasty.com/placeholder.png'

const BAD_VIEWED_ITEMS_PLACEMENT_TTL_MS = 1000 * 60 * 10
const badViewedItemsPlacements = new Map<string, number>()

type RecommendationFilter = {
  field: 'brand' | 'homepage' | 'category' | 'category_level2' | 'category_level3' | 'category_level4' | 'cart_products' | 'viewed_items'
  value?: string | string[]
  categoriesInCart?: string[]
  addedToCartProductId?: string | number | null
  viewingItemId?: string | number | null
  viewingItemSku?: string | number | null
  cartProductIds?: string[]
  placementId?: string
}

type StrategyNameMap = Record<RecommendationFilter['field'], string>

const logRecommendationEvent = (
  level: FlagshipLogLevel,
  message: string,
  payload?: Record<string, unknown>
) => {
  try {
    flagshipLogStore.addLog({
      timestamp: new Date().toISOString(),
      level,
      tag: 'recommendations',
      message,
      ...payload
    })
  } catch (error) {
    console.error('Failed to record recommendation log', error)
  }
}

const extractRecommendationId = (endpoint?: string | null) => {
  if (!endpoint) return null
  try {
    const url = new URL(endpoint)
    const segments = url.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? null
  } catch {
    return null
  }
}

const overrideRecommendationId = (endpoint?: string, placementId?: string | null) => {
  if (!endpoint) return endpoint
  if (!placementId) return endpoint
  const normalized = placementId.trim()
  if (!normalized) return endpoint
  try {
    const url = new URL(endpoint)
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length === 0) {
      return endpoint
    }
    segments[segments.length - 1] = normalized
    url.pathname = `/${segments.join('/')}`
    return url.toString()
  } catch {
    return endpoint
  }
}

const resolveStrategyTitle = (
  field: RecommendationFilter['field'] | undefined,
  names?: Partial<StrategyNameMap>
) => {
  const fallback = names?.brand || 'Recommended for you'
  if (!field) {
    return fallback
  }

  return names?.[field] || fallback
}

const buildRecommendationUrl = (
  baseEndpoint: string,
  filter?: RecommendationFilter,
  vendor?: string | null
) => {
  try {
    const url = new URL(baseEndpoint)
    const variables: Record<string, string | number | number[] | string[] | undefined> = {}
    const normalizedVendor = typeof vendor === 'string' ? vendor.trim() : ''
    if (normalizedVendor) {
      variables.vendor = normalizedVendor
    }
    if (filter?.field === 'cart_products' || filter?.field === 'viewed_items') {
      const ids = Array.isArray(filter.value) ? filter.value : []
      if (ids.length > 0) {
        const key = filter.field === 'cart_products' ? 'cart_products' : 'user_viewed_items'
        const formattedIds = ids.map((id) => String(id))
        variables[key] = formattedIds
      }
      if (filter.field === 'viewed_items' && (typeof filter.viewingItemId === 'number' || typeof filter.viewingItemId === 'string')) {
        const normalizedViewing = String(filter.viewingItemId).trim()
        if (normalizedViewing) {
          variables.viewing_item = normalizedViewing
        }
      }
      if (filter.field === 'viewed_items' && filter.viewingItemSku !== null && filter.viewingItemSku !== undefined) {
        const normalizedSku = String(filter.viewingItemSku).trim()
        if (normalizedSku) {
          variables.viewing_sku = normalizedSku
        }
      }
      const cartContextIds =
        Array.isArray(filter?.cartProductIds)
          ? filter.cartProductIds.map((id) => String(id))
          : []
      if (filter.field === 'cart_products' && !variables.cart_products && cartContextIds.length > 0) {
        variables.cart_products = cartContextIds
      }
    } else {
      const rawValue = typeof filter?.value === 'string' ? filter.value : ''
      const normalizedValue = rawValue.trim()
      const isAllValue = normalizedValue.toLowerCase() === 'all'

      if (filter?.field === 'category' && !isAllValue && normalizedValue) {
        variables.category_id = normalizedValue
      } else if (normalizedValue && !isAllValue) {
        variables.brand = normalizedValue
      }
    }

    if (
      filter?.field !== 'cart_products'
      && filter?.field !== 'viewed_items'
      && Array.isArray(filter?.cartProductIds)
      && filter.cartProductIds.length > 0
    ) {
      const ids = filter.cartProductIds.map((id) => String(id))
      if (ids.length > 0) {
        variables.cart_products = ids
      }
    }

    url.searchParams.set('variables', JSON.stringify(variables))
    return url.toString()
  } catch {
    return baseEndpoint
  }
}

const withViewingSku = async (filter?: RecommendationFilter, event?: H3Event) => {
  if (!filter || filter.field !== 'viewed_items') {
    return filter
  }
  if (filter.viewingItemId === undefined || filter.viewingItemId === null) {
    return filter
  }

  const viewingIdString = String(filter.viewingItemId).trim()
  const normalizedSku =
    filter.viewingItemSku !== null && filter.viewingItemSku !== undefined
      ? String(filter.viewingItemSku).trim()
      : ''

  if (normalizedSku && normalizedSku !== viewingIdString) {
    return filter
  }

  const match = await findProductById(viewingIdString, event)
  if (!match?.sku) {
    return filter
  }

  const candidate = String(match.sku).trim()
  if (!candidate || candidate === viewingIdString) {
    return filter
  }

  return {
    ...filter,
    viewingItemSku: candidate
  }
}

const slugify = (value: string, fallback: string) => {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized.length > 0 ? normalized : fallback
}

const normalizeRecommendationId = (value?: RawRecommendation['id']) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return null
}

const normalizeSku = (value?: RawRecommendation['sku']) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return null
}

const normalizeStringList = (value: unknown): string[] => {
  if (value === null || value === undefined) return []

  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeStringList(entry))
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return [String(value)]
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    const looksLikeJsonArray = trimmed.startsWith('[') && trimmed.endsWith(']')
    const looksLikeQuotedJson = trimmed.startsWith('"') && trimmed.endsWith('"')
    if (looksLikeJsonArray || looksLikeQuotedJson) {
      try {
        const parsed = JSON.parse(trimmed) as unknown
        const parsedList = normalizeStringList(parsed)
        if (parsedList.length) return parsedList
      } catch {
        // Fall back below
      }
    }

    if (trimmed.includes(',')) {
      const split = trimmed.split(',').map((part) => part.trim()).filter(Boolean)
      if (split.length > 1) return split
    }

    return [trimmed]
  }

  return []
}

const normalizePrice = (value: RawRecommendation['price']) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

const normalizeOptionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const getStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') return null
  const record = error as Record<string, unknown>
  const statusCode = record.statusCode
  if (typeof statusCode === 'number' && Number.isFinite(statusCode)) return statusCode
  const status = record.status
  if (typeof status === 'number' && Number.isFinite(status)) return status
  const response = record.response
  if (response && typeof response === 'object') {
    const responseRecord = response as Record<string, unknown>
    const responseStatus = responseRecord.status
    if (typeof responseStatus === 'number' && Number.isFinite(responseStatus)) return responseStatus
  }
  return null
}

const stripUnsupportedRecommendationFields = (requestUrl: string) => {
  try {
    const url = new URL(requestUrl)
    const rawFields = url.searchParams.get('fields')
    if (!rawFields) return requestUrl

    const parsed = JSON.parse(rawFields) as unknown
    if (!Array.isArray(parsed)) return requestUrl

    const nextFields = parsed
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0)
      .filter((value) => value !== 'beforePrice' && value !== 'discountPercentage')

    if (nextFields.length === parsed.length) {
      return requestUrl
    }

    if (nextFields.length === 0) {
      url.searchParams.delete('fields')
      return url.toString()
    }

    url.searchParams.set('fields', JSON.stringify(nextFields))
    return url.toString()
  } catch {
    return requestUrl
  }
}

const replaceRecommendationFieldAliases = (requestUrl: string) => {
  try {
    const url = new URL(requestUrl)
    const rawFields = url.searchParams.get('fields')
    if (!rawFields) return requestUrl

    const parsed = JSON.parse(rawFields) as unknown
    if (!Array.isArray(parsed)) return requestUrl

    let changed = false
    const nextFields = parsed
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0)
      .map((value) => {
        if (value === 'beforePrice') {
          changed = true
          return 'price_before_discount'
        }
        if (value === 'discountPercentage') {
          changed = true
          return 'discount_percentage'
        }
        return value
      })

    if (!changed) return requestUrl

    url.searchParams.set('fields', JSON.stringify(nextFields))
    return url.toString()
  } catch {
    return requestUrl
  }
}

const buildRecommendation422Fallbacks = (requestUrl: string) => {
  const candidates = [
    requestUrl,
    replaceRecommendationFieldAliases(requestUrl),
    stripUnsupportedRecommendationFields(requestUrl)
  ]
  const unique: string[] = []
  for (const candidate of candidates) {
    if (!candidate) continue
    if (!unique.includes(candidate)) unique.push(candidate)
  }
  return unique
}

const ensureAbsoluteLink = (link: string | undefined, siteUrl?: string) => {
  if (!link) return undefined

  const trimmed = link.trim()
  if (!trimmed) return undefined

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    // Keep AB Tasty "absolute_link" as an internal path so navigation stays on the current origin.
    return trimmed
  }

  return undefined
}

const extractProductIdFromLink = (link?: string) => {
  if (!link) return null
  const trimmed = link.trim()
  if (!trimmed) return null

  // Accept relative or absolute URLs.
  let pathname = trimmed
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      pathname = new URL(trimmed).pathname
    }
  } catch {
    // Ignore parse errors; fallback to raw string.
  }

  // Supported shapes:
  // - /products/93212
  // - /v/<vendor>/products/93212
  // - /v/companyId/<vendor>/products/93212
  const match = pathname.match(/\/products\/(\d+)(?:\/|$)/)
  return match?.[1] ?? null
}

const normalizeItem = (
  item: RawRecommendation,
  index: number,
  catalog: Product[],
  fallbackIdSeed: () => number,
  siteUrl?: string,
  vendorId?: string | null
): RecommendationProduct => {
  const name = item.name?.trim() || `Recommended product ${index + 1}`
  const normalizedName = name.toLowerCase()
  const absoluteLink = ensureAbsoluteLink(item.link ?? item.absolute_link, siteUrl)
  const recommendationId = normalizeRecommendationId(item.id)
  const sku = normalizeSku(item.sku)
  const sizes = normalizeStringList(item.size)
  const beforePrice =
    normalizeOptionalNumber(item.beforePrice)
    ?? normalizeOptionalNumber(item.before_price)
    ?? (() => {
      const candidate = item.price_before_discount
      if (candidate && typeof candidate === 'object' && 'amount' in candidate) {
        return normalizeOptionalNumber((candidate as { amount?: unknown }).amount)
      }
      return normalizeOptionalNumber(candidate)
    })()

  const discountPercentage =
    normalizeOptionalNumber(item.discountPercentage)
    ?? normalizeOptionalNumber(item.discount_percentage)
    ?? normalizeOptionalNumber(item.discount_percent)
  const beforePriceValue = beforePrice !== null && beforePrice > 0 ? beforePrice : null
  const discountValue = discountPercentage !== null && discountPercentage > 0 ? discountPercentage : null
  const linkedProductId =
    extractProductIdFromLink(absoluteLink)
    || extractProductIdFromLink(item.link)
    || extractProductIdFromLink(item.absolute_link)
    || null
  const matchingProduct = (
    (linkedProductId
      ? (catalog.find((product) => String(product.id) === linkedProductId) ?? null)
      : null)
    ?? (sku
      ? (catalog.find((product) => String(product.sku ?? '').trim() === sku) ?? null)
      : null)
    ?? (catalog.find((product) => product.name.toLowerCase() === normalizedName) ?? null)
  )

  // Link to internal product pages if we can resolve an id from the catalog
  // OR the recommendation link already points to a product id.
  const detailProductId = matchingProduct ? String(matchingProduct.id) : linkedProductId
  const detailPathSuffix = detailProductId ? encodeURIComponent(detailProductId) : null
  const normalizedVendorId = typeof vendorId === 'string' ? vendorId.trim() : ''
  const detailUrl = detailPathSuffix
    ? (normalizedVendorId ? `/v/${encodeURIComponent(normalizedVendorId)}/products/${detailPathSuffix}` : `/products/${detailPathSuffix}`)
    : null

  const externalUrl = absoluteLink && /^https?:\/\//i.test(absoluteLink) ? absoluteLink : undefined

  if (matchingProduct) {
    const remotePrice = normalizePrice(item.price)
    const productForCarousel =
      remotePrice > 0 && remotePrice !== matchingProduct.price
        ? { ...matchingProduct, price: remotePrice }
        : matchingProduct
    const productWithSku =
      sku && !productForCarousel.sku ? { ...productForCarousel, sku } : productForCarousel
    const productWithSkuAndSizes =
      sizes.length
      && (!productWithSku.sizes?.length || (productWithSku.sizes.length === 1 && productWithSku.sizes[0] === 'One Size'))
        ? { ...productWithSku, sizes }
        : productWithSku
    const productWithDiscount =
      beforePriceValue !== null && discountValue !== null
        ? { ...productWithSkuAndSizes, price_before_discount: beforePriceValue, discountPercentage: discountValue }
        : productWithSkuAndSizes
    const productWithSource = { ...productWithDiscount, recoSource: 'abtasty' as const }
    const productWithSourceAndLink =
      absoluteLink ? { ...productWithSource, link: absoluteLink } : productWithSource

    return {
      id: String(recommendationId ?? matchingProduct.slug),
      product: productWithSourceAndLink,
      detailUrl: detailUrl ?? `/products/${encodeURIComponent(String(matchingProduct.id))}`,
      externalUrl,
      absoluteLink
    }
  }

  const slug = slugify(name, `recommended-${index + 1}`)
  const fallbackId = fallbackIdSeed()

  const fallbackProduct: Product = {
    id: fallbackId,
    slug: `${slug}-${fallbackId}`,
    name,
    description: item.description?.trim() || '',
    price: normalizePrice(item.price),
    price_before_discount: beforePriceValue ?? undefined,
    discountPercentage: discountValue ?? undefined,
    category: 'Recommendations',
    image: item.img_link?.trim() || PLACEHOLDER_IMAGE,
    rating: 4.8,
    highlights: ['Exclusive pick curated for you'],
    inStock: true,
    colors: [],
    sizes: sizes.length ? sizes : ['One Size'],
    sku,
    recoSource: 'abtasty',
    brand: item.brand?.trim() || undefined,
    stock: undefined,
    availabilityStatus: 'In stock',
    returnPolicy: undefined,
    link: absoluteLink
  }

  return {
    id: String(recommendationId ?? fallbackProduct.slug),
    product: fallbackProduct,
    detailUrl: detailUrl ?? undefined,
    externalUrl,
    absoluteLink
  }
}

export const fetchRecommendations = async (
  filter?: RecommendationFilter,
  event?: H3Event
): Promise<RecommendationResponse> => {
  const config = useRuntimeConfig()
  const debugMode = String((config as { recommendations?: { debug?: unknown } })?.recommendations?.debug ?? '')
    .trim()
    .toLowerCase()
  const debugSummary = debugMode === 'true' || debugMode === '1' || debugMode === 'yes' || debugMode === 'summary' || debugMode === 'raw'
  const debugRaw = debugMode === 'raw'
  const apiKey = config.recommendations?.apiKey
  const endpoint = config.recommendations?.endpoint
  const categoryEndpoint = config.recommendations?.categoryEndpoint
  const cartEndpoint = config.recommendations?.cartEndpoint
  const viewedItemsEndpoint = config.recommendations?.viewedItemsEndpoint
  const homepageEndpoint = config.recommendations?.homepageEndpoint
  const siteUrl = config.recommendations?.siteUrl
  const strategyNames = config.recommendations?.strategyNames as
    | Partial<StrategyNameMap>
    | undefined

  let baseEndpointRaw: string | undefined = endpoint
  if (filter?.field === 'category') {
    baseEndpointRaw = categoryEndpoint || endpoint
  } else if (filter?.field === 'cart_products') {
    baseEndpointRaw = cartEndpoint || endpoint
  } else if (filter?.field === 'viewed_items') {
    baseEndpointRaw = viewedItemsEndpoint || endpoint
  } else if (filter?.field === 'homepage') {
    baseEndpointRaw = homepageEndpoint || endpoint
  }
  const placementId = filter?.placementId?.trim() || ''
  const now = Date.now()
  const placementBlockedUntil = placementId ? badViewedItemsPlacements.get(placementId) : undefined
  const isDev = process.env.NODE_ENV !== 'production'
  const allowPlacementOverride =
    Boolean(placementId)
    && (!placementBlockedUntil || placementBlockedUntil < now)
    && !isDev

  const baseEndpoint = allowPlacementOverride
    ? (overrideRecommendationId(baseEndpointRaw, placementId) || baseEndpointRaw)
    : baseEndpointRaw

  if (!apiKey || !baseEndpoint) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Recommendation credentials are missing. Please configure runtimeConfig.recommendations.'
    })
  }

  let lastRequestUrl: string | null = null
  const selectedVendor = await getSelectedVendor(event)

  const performFetch = async (
    activeFilter: RecommendationFilter | undefined,
    endpointOverride?: string
	  ) => {
	    const requestUrl = buildRecommendationUrl(endpointOverride || baseEndpoint, activeFilter, selectedVendor)
	    lastRequestUrl = requestUrl
	    const strategyField = activeFilter?.field ?? filter?.field ?? 'brand'
	    const recommendationName = resolveStrategyTitle(strategyField, strategyNames)
	    const recommendationId = extractRecommendationId(requestUrl)
	    console.log('[Recommendations] Fetching AB Tasty feed', {
	      endpoint: requestUrl,
	      field: strategyField,
	      value: activeFilter?.value ?? filter?.value
	    })
	    logRecommendationEvent('INFO', 'Fetching AB Tasty recommendations feed', {
	      endpoint: requestUrl,
	      field: strategyField,
	      value: activeFilter?.value ?? filter?.value,
	      recommendationName,
	      recommendationId
	    })

	    const fetchResponse = async (url: string) =>
	      await $fetch<{ name?: string; items?: RawRecommendation[] }>(url, {
	        headers: {
	          Authorization: `Bearer ${apiKey}`,
	          Accept: 'application/json'
	        }
	      })

	    let response: { name?: string; items?: RawRecommendation[] } | null = null
	    try {
	      response = await fetchResponse(requestUrl)
	    } catch (error) {
	      const statusCode = getStatusCode(error)
	      if (statusCode === 422) {
	        const fallbacks = buildRecommendation422Fallbacks(requestUrl)
	        let recovered = false
	        for (const fallbackUrl of fallbacks.slice(1)) {
	          try {
	            console.warn('[Recommendations] unsupported fields; retrying with fallback fields', {
	              original: requestUrl,
	              fallback: fallbackUrl
	            })
	            lastRequestUrl = fallbackUrl
	            response = await fetchResponse(fallbackUrl)
	            recovered = true
	            break
	          } catch (fallbackError) {
	            const fallbackStatus = getStatusCode(fallbackError)
	            if (fallbackStatus === 422) {
	              continue
	            }
	            throw fallbackError
	          }
	        }
		        if (!recovered) {
		          throw error
		        }
	      } else {
	        throw error
	      }
	    }

	    if (!response?.items || !Array.isArray(response.items)) {
	      throw createError({
	        statusCode: 502,
	        statusMessage: 'Recommendations payload is invalid.'
	      })
	    }

      if (debugSummary) {
        console.log('[Recommendations] AB Tasty response', {
          endpoint: lastRequestUrl,
          name: response.name ?? null,
          itemCount: response.items.length,
          firstItem: response.items[0] ?? null
        })
      }
      if (debugRaw) {
        console.log('[Recommendations] AB Tasty response (raw)', {
          endpoint: lastRequestUrl,
          response
        })
      }

    const catalog = await fetchProducts(event)
    let fallbackSeed = 900000
    const fallbackIdSeed = () => fallbackSeed++

    const normalizedItems = response.items
      .map((item, index) => normalizeItem(item, index, catalog, fallbackIdSeed, siteUrl, selectedVendor))
      .filter(
        (item, index, self) => self.findIndex((candidate) => candidate.id === item.id) === index
      )

    const resolvedTitle = response.name?.trim() || recommendationName
    logRecommendationEvent('INFO', 'Recommendations feed loaded', {
      field: strategyField,
      endpoint: requestUrl,
      items: normalizedItems.length,
      title: resolvedTitle,
      recommendationName: resolvedTitle,
      recommendationId
    })

    return {
      title: resolvedTitle,
      items: normalizedItems
    }
  }

  try {
    const resolvedFilter = await withViewingSku(filter, event)
    const shouldRetryViewedItems = resolvedFilter?.field === 'viewed_items' && Boolean(baseEndpointRaw)
    const attempts: Array<{
      filter: RecommendationFilter | undefined
      endpointOverride?: string
      label: string
    }> = [{ filter: resolvedFilter, label: 'viewed_items:default' }]

    if (shouldRetryViewedItems) {
      const hasViewingSku =
        resolvedFilter.viewingItemSku !== null && resolvedFilter.viewingItemSku !== undefined
      if (hasViewingSku) {
        attempts.push({
          filter: { ...resolvedFilter, viewingItemSku: null },
          label: 'viewed_items:no_viewing_sku'
        })
      }

      if (filter?.placementId) {
        attempts.push({
          filter: resolvedFilter,
          endpointOverride: baseEndpointRaw,
          label: 'viewed_items:no_placement_override'
        })
        if (hasViewingSku) {
          attempts.push({
            filter: { ...resolvedFilter, viewingItemSku: null },
            endpointOverride: baseEndpointRaw,
            label: 'viewed_items:no_placement_override_no_viewing_sku'
          })
        }
      }
    }

    let lastError: unknown = null
    for (const attempt of attempts) {
      try {
        if (attempt.label !== 'viewed_items:default') {
          console.debug('Viewed_items recommendation retry', { attempt: attempt.label })
        }
        return await performFetch(attempt.filter, attempt.endpointOverride)
      } catch (error) {
        lastError = error
        const statusCode = (error as { statusCode?: number })?.statusCode
        if (!statusCode || statusCode < 400) {
          break
        }
      }
    }

    throw lastError
  } catch (error) {
    const statusCode = getStatusCode(error)
    const failedRecommendationName = resolveStrategyTitle(filter?.field, strategyNames)
    const failedRecommendationId = extractRecommendationId(lastRequestUrl)

  const shouldRetryWithoutCartContext =
    filter?.field === 'cart_products'
    && statusCode
    && statusCode >= 400
    && ((filter.categoriesInCart?.length ?? 0) > 0 || Boolean(filter.addedToCartProductId))

  if (shouldRetryWithoutCartContext) {
    console.warn('Cart recommendation request failed, retrying without cart context')
    logRecommendationEvent('WARNING', 'Cart recommendation request failed with context, retrying', {
      endpoint: lastRequestUrl,
      statusCode,
      field: filter?.field,
      categories: filter?.categoriesInCart,
      addedToCartProductId: filter?.addedToCartProductId,
      recommendationName: failedRecommendationName,
      recommendationId: failedRecommendationId
    })

    return await performFetch({
      ...filter,
      categoriesInCart: undefined,
      addedToCartProductId: undefined
    })
  }

    if (statusCode && statusCode >= 400) {
      console.error('Recommendations unavailable, returning empty set', error)
      logRecommendationEvent('ERROR', 'Recommendations request failed', {
        endpoint: lastRequestUrl,
        statusCode,
        field: filter?.field,
        error: error instanceof Error ? error.message : String(error),
        recommendationName: failedRecommendationName,
        recommendationId: failedRecommendationId
      })
      return {
        title: resolveStrategyTitle(filter?.field, strategyNames),
        items: []
      }
    }

    console.error('Failed to load recommendations, returning empty set', error)
    logRecommendationEvent('ERROR', 'Recommendations request failed', {
      endpoint: lastRequestUrl,
      field: filter?.field,
      error: error instanceof Error ? error.message : String(error),
      recommendationName: failedRecommendationName,
      recommendationId: failedRecommendationId
    })
    return {
      title: resolveStrategyTitle(filter?.field, strategyNames),
      items: []
    }
  }
}

export const fetchSearchResultsRecommendations = async (
  params: { placementId: string; searchResultIds: Array<string | number> },
  event?: H3Event
): Promise<RecommendationResponse> => {
  const config = useRuntimeConfig()
  const apiKey = config.recommendations?.apiKey
  const endpoint = config.recommendations?.endpoint
  const siteUrl = config.recommendations?.siteUrl

  const placementId = params.placementId?.trim()
  const searchResultIds = Array.isArray(params.searchResultIds)
    ? params.searchResultIds.map((id) => String(id).trim()).filter(Boolean)
    : []

  if (!apiKey || !endpoint || !placementId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Recommendation credentials are missing. Please configure runtimeConfig.recommendations.'
    })
  }

  const selectedVendor = await getSelectedVendor(event)
  const baseEndpoint = overrideRecommendationId(endpoint, placementId) || endpoint

  const requestUrl = (() => {
    try {
      const url = new URL(baseEndpoint)
      url.searchParams.set(
        'variables',
        JSON.stringify({
          ...(selectedVendor ? { vendor: selectedVendor } : {}),
          search_results: searchResultIds
        })
      )
      return url.toString()
    } catch {
      return baseEndpoint
    }
  })()

	  logRecommendationEvent('INFO', 'Fetching AB Tasty recommendations feed (search_results)', {
	    endpoint: requestUrl,
	    field: 'search_results',
	    placementId,
	    vendor: selectedVendor || null,
	    search_results: searchResultIds.slice(0, 50)
	  })

	  const fetchResponse = async (url: string) =>
	    await $fetch<{ name?: string; items?: RawRecommendation[] }>(url, {
	      headers: {
	        Authorization: `Bearer ${apiKey}`,
	        Accept: 'application/json'
	      }
	    })

	  let response: { name?: string; items?: RawRecommendation[] } | null = null
	  try {
	    response = await fetchResponse(requestUrl)
	  } catch (error) {
	    const statusCode = getStatusCode(error)
	    if (statusCode === 422) {
	      const fallbacks = buildRecommendation422Fallbacks(requestUrl)
	      let recovered = false
	      for (const fallbackUrl of fallbacks.slice(1)) {
	        try {
	          console.warn('[Recommendations] unsupported fields; retrying search_results with fallback fields', {
	            original: requestUrl,
	            fallback: fallbackUrl
	          })
	          response = await fetchResponse(fallbackUrl)
	          recovered = true
	          break
	        } catch (fallbackError) {
	          const fallbackStatus = getStatusCode(fallbackError)
	          if (fallbackStatus === 422) {
	            continue
	          }
	          throw fallbackError
	        }
	      }
	      if (!recovered) {
	        throw error
	      }
	    } else {
	      throw error
	    }
	  }

	  if (!response?.items || !Array.isArray(response.items)) {
	    throw createError({
	      statusCode: 502,
	      statusMessage: 'Recommendations payload is invalid.'
	    })
	  }

  const catalog = await fetchProducts(event)
  let fallbackSeed = 910000
  const fallbackIdSeed = () => fallbackSeed++

  const normalizedItems = response.items
    .map((item, index) => normalizeItem(item, index, catalog, fallbackIdSeed, siteUrl, selectedVendor))
    .filter(
      (item, index, self) => self.findIndex((candidate) => candidate.id === item.id) === index
    )

  return {
    title: response.name?.trim() || 'Recommended for you',
    items: normalizedItems
  }
}

const normalizeFilterFromSource = (
  sourceField: unknown,
  sourceValue: unknown,
  categories?: unknown,
  addedToCartProduct?: unknown,
  viewingItem?: unknown,
  viewingSku?: unknown,
  cartProducts?: unknown,
  placementId?: unknown
): RecommendationFilter => {
  let field: RecommendationFilter['field'] = 'brand'
  if (sourceField === 'category') {
    field = 'category'
  } else if (sourceField === 'cart_products') {
    field = 'cart_products'
  } else if (sourceField === 'viewed_items') {
    field = 'viewed_items'
  } else if (sourceField === 'homepage') {
    field = 'homepage'
  }

  let value: RecommendationFilter['value']
  if (field === 'cart_products' || field === 'viewed_items') {
    if (Array.isArray(sourceValue)) {
      value = sourceValue
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0)
    } else if (typeof sourceValue === 'string') {
      value = sourceValue
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
    }
  } else if (typeof sourceValue === 'string') {
    value = sourceValue
  } else if (typeof sourceValue === 'number') {
    value = String(sourceValue)
  }

  let categoriesInCart: string[] | undefined
  if (field === 'cart_products' && categories) {
    const arr = Array.isArray(categories) ? categories : typeof categories === 'string' ? [categories] : []
    const normalized = arr
      .map((category) => (typeof category === 'string' ? category.trim() : ''))
      .filter((category) => category.length > 0)
    if (normalized.length > 0) {
      categoriesInCart = normalized
    }
  }

  let addedToCartProductId: string | undefined
  if (field === 'cart_products' && addedToCartProduct !== undefined) {
    const trimmed = String(addedToCartProduct).trim()
    if (trimmed) {
      addedToCartProductId = trimmed
    }
  }

  let viewingItemId: string | undefined
  if (field === 'viewed_items' && viewingItem !== undefined) {
    const trimmed = String(viewingItem).trim()
    if (trimmed) {
      viewingItemId = trimmed
    }
  }

  let viewingItemSku: string | undefined
  if (field === 'viewed_items' && viewingSku !== undefined && viewingSku !== null) {
    const trimmed = String(viewingSku).trim()
    if (trimmed) {
      viewingItemSku = trimmed
    }
  }

  let cartProductIds: string[] | undefined
  if (cartProducts !== undefined) {
    if (Array.isArray(cartProducts)) {
      cartProductIds = cartProducts
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0)
    } else if (typeof cartProducts === 'string') {
      cartProductIds = cartProducts
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
    }
  }

  const normalizedPlacementId =
    placementId !== undefined && placementId !== null ? String(placementId).trim() : ''

  return {
    field,
    value,
    categoriesInCart,
    addedToCartProductId,
    viewingItemId,
    viewingItemSku,
    cartProductIds,
    placementId: normalizedPlacementId.length > 0 ? normalizedPlacementId : undefined
  }
}

export const handleRecommendationsRequest = async (event: H3Event, method: 'GET' | 'POST') => {
  if (method === 'GET') {
    const query = getQuery(event)
    return await fetchRecommendations(
      normalizeFilterFromSource(
        query.filterField,
        query.filterValue,
        query.categoriesInCart,
        query.addedToCartProductId,
        query.viewingItemId,
        query.viewingItemSku,
        query.cartProductIds,
        query.placementId
      ),
      event
    )
  }

  const body = await readBody<{
    filterField?: string
    filterValue?: string | Array<string | number> | number | null
    categoriesInCart?: string[] | string | null
    addedToCartProductId?: number | string | null
    viewingItemId?: number | string | null
    viewingItemSku?: string | null
    cartProductIds?: Array<string | number> | string | null
    placementId?: string | null
  }>(event)

  return await fetchRecommendations(
    normalizeFilterFromSource(
      body?.filterField,
      body?.filterValue,
      body?.categoriesInCart ?? undefined,
      body?.addedToCartProductId ?? undefined,
      body?.viewingItemId ?? undefined,
      body?.viewingItemSku ?? undefined,
      body?.cartProductIds ?? undefined,
      body?.placementId ?? undefined
    ),
    event
  )
}

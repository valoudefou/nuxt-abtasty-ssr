import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

import { useRuntimeConfig } from '#imports'
import type { H3Event } from 'h3'

import type { Product } from '@/types/product'
import { products as fallbackProducts } from '@/data/products'
import { getSelectedVendor } from '@/server/utils/vendors'

export type RemoteProduct = {
  id: string | number
  name?: string | null
  title?: string | null
  description?: string | null
  category?: string | null
  category_level2?: string | null
  category_level3?: string | null
  category_level4?: string | null
  categoryIds?: string[] | null
  link?: string | null
  price?: { amount?: string | number | null; currency?: string | null } | string | number | null
  price_before_discount?: string | number | null
  discountPercentage?: string | number | null
  rating?: string | number | null
  stock?: string | number | null
  brand?: string | null
  brandId?: string | null
  sku?: string | null
  availabilityStatus?: string | null
  status?: string | null
  returnPolicy?: string | null
  thumbnail?: string | null
  images?: Array<{ url?: string | null }> | null
  tag?: string | null
  recency?: string | number | null
  vendor?: string | null
  vendorId?: string | null
  breadcrumbs?: string | string[] | null
}

export type RemoteResponse = {
  data?: RemoteProduct[]
  page?: number
  limit?: number
  products?: RemoteProduct[]
  nextCursor?: string | null
  next_cursor?: string | null
}

const DEFAULT_API_BASE = 'https://api.live-server1.com'
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes
const CACHE_VERSION = 1
const CACHE_FILE = process.env.VERCEL
  ? path.resolve('/tmp', 'products-cache.json')
  : path.resolve(process.cwd(), 'data', 'products-cache.json')
const REMOTE_FETCH_TIMEOUT_MS = 0
const LOG_PREFIX = '[ProductsAPI]'
const REMOTE_BACKOFF_MS = 0
const PAGE_SIZE = 100
const PAGE_RETRY_COUNT = 2
const PAGE_RETRY_DELAY_MS = 300
const PRELOAD_MAX_PAGES_PROD = 2

let cachedProducts: Product[] | null = null
let lastFetch = 0
let cachedVersion = 0
let remoteBackoffUntil = 0

const PLACEHOLDER_IMAGE = 'https://assets-manager.abtasty.com/placeholder.png'

type ProductCacheFile = {
  version: number
  fetchedAt: number
  products: Product[]
}

const readCacheFile = async (): Promise<ProductCacheFile | null> => {
  try {
    const data = await readFile(CACHE_FILE, 'utf-8')
    const parsed = JSON.parse(data) as ProductCacheFile
    if (!parsed || !Array.isArray(parsed.products) || parsed.products.length === 0) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const writeCacheFile = async (payload: ProductCacheFile) => {
  if (payload.products.length === 0) {
    return
  }

  try {
    await mkdir(path.dirname(CACHE_FILE), { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify(payload))
  } catch (error) {
    console.warn('Failed to write product cache file', error)
  }
}

const normalizeProductsResponse = (response: RemoteResponse | RemoteProduct[]): RemoteProduct[] =>
  Array.isArray(response) ? response : response.data ?? response.products ?? []

const getApiConfig = async (event?: H3Event) => {
  const config = useRuntimeConfig()
  const baseRaw = config.public?.apiBase || config.public?.productsApiBase || DEFAULT_API_BASE
  const base = baseRaw.replace(/\/+$/, '')
  const disableRemote = Boolean(config.public?.productsDisableRemote)
  const configuredVendorId = config.public?.productsVendorId ? String(config.public.productsVendorId).trim() : ''
  const vendorId = event ? await getSelectedVendor(event) : configuredVendorId
  return { base, disableRemote, vendorId }
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  if (timeoutMs <= 0) {
    return await promise
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Remote fetch timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

const getRetryAfterMs = (error: unknown) => {
  const headerValue = (error as { response?: { headers?: { get?: (key: string) => string | null } } })
    ?.response?.headers?.get?.('retry-after')
  if (!headerValue) {
    return null
  }
  const seconds = Number.parseInt(headerValue, 10)
  return Number.isFinite(seconds) ? seconds * 1000 : null
}

const parseNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0
  }

  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value

  return Number.isFinite(numeric) ? Number(numeric) : 0
}

const slugify = (value: string, fallback: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized.length > 0 ? normalized : fallback
}

const sanitizeCategory = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return undefined
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const sanitizeVendor = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return undefined
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const buildImageUrl = (value: string | null | undefined) => {
  if (!value) {
    return PLACEHOLDER_IMAGE
  }

  const trimmed = String(value).trim()
  if (!trimmed) {
    return PLACEHOLDER_IMAGE
  }

  // Use the original upstream image URL from the feed.
  return trimmed
}

const normalizeFallbackProduct = (product: Product): Product => ({
  ...product,
  title: product.title ?? product.name,
  thumbnail: product.thumbnail ?? product.image
})

const fallbackCatalog = fallbackProducts.map(normalizeFallbackProduct)

export const normalizeRemoteProduct = (raw: RemoteProduct): Product => {
  const id = raw.id
  const name = raw.name ?? raw.title ?? `Product ${String(id)}`
  const pricePayload = raw.price
  const priceAmount =
    pricePayload && typeof pricePayload === 'object'
      ? parseNumber(pricePayload.amount ?? 0)
      : parseNumber(pricePayload ?? raw.price_before_discount)
  const price = Math.max(priceAmount, 0)
  const priceCurrency =
    pricePayload && typeof pricePayload === 'object' && typeof pricePayload.currency === 'string'
      ? pricePayload.currency
      : undefined
  const rating = Math.min(Math.max(parseNumber(raw.rating), 0), 5)
  const stock = Math.max(parseNumber(raw.stock), 0)
  const discount = parseNumber(raw.discountPercentage)
  const availability = raw.availabilityStatus?.trim() ?? ''
  const status = raw.status?.trim() ?? ''
  const hasStockSignal = raw.stock !== null && raw.stock !== undefined
  const hasAvailabilitySignal = availability.length > 0
  const hasStatusSignal = status.length > 0
  const inStock =
    hasAvailabilitySignal || hasStatusSignal || hasStockSignal
      ? availability.toLowerCase() === 'in stock'
        || status.toLowerCase() === 'active'
        || stock > 0
      : true

  const brandValue = sanitizeBrand(raw.brandId ?? raw.brand)
  const vendor = sanitizeVendor(raw.vendorId ?? raw.vendor)
  const categoryIds = Array.isArray(raw.categoryIds)
    ? raw.categoryIds.map((value) => String(value).trim()).filter(Boolean)
    : []
  const normalizedCategory = sanitizeCategory(raw.category)
  if (normalizedCategory && !categoryIds.includes(normalizedCategory)) {
    categoryIds.unshift(normalizedCategory)
  }
  const categoryPrimary = normalizedCategory ?? categoryIds[0]

  const highlightItems = [
    brandValue ? `Brand: ${brandValue}` : null,
    vendor ? `Vendor: ${vendor}` : null,
    discount > 0 ? `Save ${discount.toFixed(0)}% today` : null,
    raw.returnPolicy ? `Returns: ${raw.returnPolicy}` : null,
    availability ? `Availability: ${availability}` : null,
    status ? `Status: ${status}` : null
  ].filter((item): item is string => Boolean(item))

  if (highlightItems.length === 0) {
    highlightItems.push('Curated selection from Commerce Demo partners.')
  }

  const tagSet = new Set<string>()

  if (categoryPrimary) tagSet.add(categoryPrimary)
  if (brandValue) tagSet.add(brandValue)
  if (raw.tag) tagSet.add(raw.tag)

  const tags = Array.from(tagSet)

  const slugBase = slugify(name, `product-${String(id)}`)
  const slug = `${slugBase}-${String(id)}`

  const productLink = `/products/${encodeURIComponent(String(id))}`

  return {
    id,
    slug,
    name,
    title: name,
    description: raw.description ?? '',
    price,
    category: categoryPrimary ?? 'General',
    category_level2: sanitizeCategory(raw.category_level2),
    category_level3: sanitizeCategory(raw.category_level3),
    category_level4: sanitizeCategory(raw.category_level4),
    image: buildImageUrl(raw.images?.[0]?.url ?? raw.thumbnail),
    thumbnail: raw.images?.[0]?.url ?? raw.thumbnail ?? undefined,
    rating,
    highlights: highlightItems,
    inStock,
    colors: tags,
    sizes: ['One Size'],
    brand: brandValue || undefined,
    vendor: vendor || undefined,
    brandId: brandValue || undefined,
    vendorId: vendor || undefined,
    categoryIds,
    priceCurrency,
    stock,
    discountPercentage: discount,
    price_before_discount: raw.price_before_discount ?? undefined,
    sku: raw.sku ?? undefined,
    tag: raw.tag ?? undefined,
    recency: raw.recency ?? undefined,
    availabilityStatus: availability || undefined,
    returnPolicy: raw.returnPolicy ?? undefined,
    link: productLink
  }
}

const fetchRemoteProducts = async (
  base: string,
  params: Record<string, string | number> = {},
  options: { maxPages?: number } = {}
): Promise<RemoteProduct[]> => {
  const products: RemoteProduct[] = []
  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY
  let cursor: string | null = null

  for (let page = 1; page <= maxPages; page += 1) {
    let response: RemoteResponse | RemoteProduct[] | null = null
    let attempt = 0
    let pageError: unknown = null

    while (attempt <= PAGE_RETRY_COUNT) {
      try {
        response = await withTimeout(
          $fetch<RemoteResponse | RemoteProduct[]>(`${base}/products`, {
            params: { ...params, limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) }
          }),
          REMOTE_FETCH_TIMEOUT_MS
        )
        pageError = null
        break
      } catch (error) {
        pageError = error
        const status = (error as { statusCode?: number; response?: { status?: number } })?.statusCode
          ?? (error as { response?: { status?: number } })?.response?.status
        attempt += 1
        if (attempt <= PAGE_RETRY_COUNT) {
          const retryAfterMs = status === 429 ? getRetryAfterMs(error) : null
          const delayMs = retryAfterMs ?? PAGE_RETRY_DELAY_MS * attempt
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
    }

    if (!response) {
      console.warn(`${LOG_PREFIX} failed to fetch page; returning partial catalog.`, {
        page,
        error: pageError
      })
      break
    }

    const batch = normalizeProductsResponse(response)
    if (batch.length === 0) {
      break
    }

    products.push(...batch)
    cursor = Array.isArray(response)
      ? null
      : response.nextCursor ?? response.next_cursor ?? null
    if (!cursor) {
      break
    }
  }

  return products
}

export const fetchProducts = async (event?: H3Event): Promise<Product[]> => {
  const now = Date.now()
  const { base, disableRemote, vendorId } = await getApiConfig(event)
  const vendorFilter = vendorId.trim().toLowerCase()
  const filterByVendor = (items: Product[]) => {
    if (!vendorFilter) return items
    return items.filter((product) => product.vendor?.trim().toLowerCase() === vendorFilter)
  }

  if (cachedProducts && cachedVersion === CACHE_VERSION && now - lastFetch < CACHE_TTL) {
    return filterByVendor(cachedProducts)
  }

  if (now < remoteBackoffUntil) {
    if (cachedProducts && cachedVersion === CACHE_VERSION) {
      return filterByVendor(cachedProducts)
    }
  }

  try {
    if (!cachedProducts) {
      const cached = await readCacheFile()
      if (cached && cached.version === CACHE_VERSION) {
        cachedProducts = cached.products
        cachedVersion = cached.version
        lastFetch = cached.fetchedAt
        if (now - cached.fetchedAt < CACHE_TTL) {
          return filterByVendor(cached.products)
        }
      }
    }

    if (disableRemote) {
      console.warn(`${LOG_PREFIX} remote fetch disabled; using cache/fallback only.`)
      if (cachedProducts && cachedVersion === CACHE_VERSION) {
        return filterByVendor(cachedProducts)
      }
      return filterByVendor(fallbackCatalog)
    }
    if (process.dev) {
      console.warn(`${LOG_PREFIX} skipping remote preload in dev; using cache/fallback only.`)
      if (cachedProducts && cachedVersion === CACHE_VERSION) {
        return filterByVendor(cachedProducts)
      }
      return filterByVendor(fallbackCatalog)
    }
    const requestStart = Date.now()
    const products = await fetchRemoteProducts(
      base,
      vendorId ? { vendorId } : {},
      { maxPages: process.dev ? 0 : PRELOAD_MAX_PAGES_PROD }
    )
    console.info(`${LOG_PREFIX} upstream response`, {
      url: `${base}/products`,
      count: products.length,
      durationMs: Date.now() - requestStart
    })
    const mapped = products.map(normalizeRemoteProduct)

    if (mapped.length === 0) {
      console.warn(`${LOG_PREFIX} no products from upstream; using cached/fallback catalog.`, {
        upstreamCount: products.length
      })
      if (cachedProducts && cachedVersion === CACHE_VERSION) {
        return filterByVendor(cachedProducts)
      }
      return filterByVendor(fallbackCatalog)
    }

    cachedProducts = mapped
    lastFetch = now
    cachedVersion = CACHE_VERSION
    remoteBackoffUntil = 0
    await writeCacheFile({ version: CACHE_VERSION, fetchedAt: now, products: mapped })

    return filterByVendor(mapped)
  } catch (error) {
    console.error('Failed to load products from remote source', error)
    remoteBackoffUntil = Date.now() + REMOTE_BACKOFF_MS
    if (cachedProducts && cachedVersion === CACHE_VERSION) {
      console.warn(`${LOG_PREFIX} using cached products after error`, {
        source: 'memory',
        count: cachedProducts.length
      })
      return filterByVendor(cachedProducts)
    }

    console.warn(`${LOG_PREFIX} using cached/fallback catalog because remote feed is unavailable.`)
    if (cachedProducts && cachedVersion === CACHE_VERSION) {
      return filterByVendor(cachedProducts)
    }
    return filterByVendor(fallbackCatalog)
  }
}

export const findProductBySlug = async (slug: string, event?: H3Event): Promise<Product | undefined> => {
  const products = await fetchProducts(event)
  return products.find((product) => product.slug === slug)
}

export const findProductById = async (id: string | number, event?: H3Event): Promise<Product | undefined> => {
  const targetId = String(id)
  const { base } = await getApiConfig(event)

  try {
    if (cachedProducts && cachedVersion === CACHE_VERSION) {
      const cachedMatch = cachedProducts.find((product) => String(product.id) === targetId)
      if (cachedMatch) {
        return cachedMatch
      }
    }

    const response = await $fetch<RemoteProduct>(`${base}/products/${encodeURIComponent(targetId)}`)
    return normalizeRemoteProduct(response)
  } catch (error) {
    const cached = cachedProducts ?? (await fetchProducts(event))
    return cached.find((product) => String(product.id) === targetId)
  }
}

const sanitizeBrand = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

export const fetchProductBrands = async (event?: H3Event): Promise<string[]> => {
  const { base, vendorId } = await getApiConfig(event)
  try {
    const response = vendorId
      ? await $fetch<{ data?: Array<{ id?: string | null }> }>(
        `${base}/vendors/${encodeURIComponent(vendorId)}/brands`,
        { params: { limit: 100000 } }
      )
      : await $fetch<{ data?: Array<{ id?: string | null }> }>(`${base}/brands`, {
        params: { limit: 100000 }
      })
    const brands = response?.data ?? []
    return brands
      .map((brand) => (brand?.id ? String(brand.id).trim() : ''))
      .filter(Boolean)
  } catch (error) {
    const products = await fetchProducts(event)
    const unique = new Set<string>()

    for (const product of products) {
      const brand = sanitizeBrand(product.brand)
      if (brand) {
        unique.add(brand)
      }
    }

    return Array.from(unique)
  }
}

export const findProductsByBrand = async (brand: string, event?: H3Event): Promise<Product[]> => {
  const normalizedBrand = sanitizeBrand(brand)

  if (!normalizedBrand) {
    return []
  }

  const { base, vendorId } = await getApiConfig(event)
  try {
    const response = await fetchRemoteProducts(base, {
      brandId: normalizedBrand,
      ...(vendorId ? { vendorId } : {})
    })
    const mapped = response.map(normalizeRemoteProduct)
    if (mapped.length > 0) {
      return mapped
    }

    const brands = await fetchProductBrands(event)
    const canonical = brands.find(
      (entry) => entry.trim().toLowerCase() === normalizedBrand.toLowerCase()
    )
    if (canonical && canonical !== normalizedBrand) {
      const retry = await fetchRemoteProducts(base, {
        brandId: canonical,
        ...(vendorId ? { vendorId } : {})
      })
      const retried = retry.map(normalizeRemoteProduct)
      if (retried.length > 0) {
        return retried
      }
    }
  } catch (error) {
    console.error('Failed to load products by brand from upstream', error)
  }

  const products = await fetchProducts(event)
  const target = normalizedBrand.toLowerCase()
  return products.filter((product) => product.brand?.toLowerCase() === target)
}

import { createError, useRuntimeConfig } from '#imports'
import { getQuery, setResponseStatus } from 'h3'
import { getSelectedVendor } from '@/server/utils/vendors'
import { fetchUpstreamJson } from '@/server/utils/upstreamFetch'
import type { RemoteResponse } from '@/server/utils/products'
import { normalizeRemoteProduct } from '@/server/utils/products'

const SEARCH_ENDPOINT = 'https://search-api.abtasty.com/search'
const SEARCH_INDEX = '47c5c9b4ee0a19c9859f47734c1e8200_Catalog'

// Example serialization:
// { categoryField: 'category', category: 'Figure' } -> filters[category][]=Figure
// { categoryField: 'categories_ids', category: '123' } -> filters[categories_ids][]=123
const coerceToStrings = (value: unknown): string[] => {
  if (value === null || value === undefined) return []
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)]
  }
  return []
}

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(coerceToStrings).filter(Boolean)
  }
  return coerceToStrings(value).filter(Boolean)
}

const appendListFilter = (url: URL, field: string, values: string[]) => {
  if (!field || values.length === 0) return
  for (const value of values) {
    url.searchParams.append(`filters[${field}][]`, value)
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const wildcard = query.wildcard === 'true'
  const textInput = typeof query.text === 'string' ? query.text.trim() : ''
  const text = textInput || (wildcard ? '*' : '')

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A search query is required.'
    })
  }

  const pageRaw = typeof query.page === 'string' ? query.page : String(query.page ?? '0')
  const hitsPerPageRaw =
    typeof query.hitsPerPage === 'string' ? query.hitsPerPage : String(query.hitsPerPage ?? '24')
  const requestedPage = Number.parseInt(pageRaw, 10)
  const requestedHitsPerPage = Number.parseInt(hitsPerPageRaw, 10)
  const page = Number.isFinite(requestedPage) && requestedPage >= 0 ? String(requestedPage) : '0'
  const hitsPerPage =
    Number.isFinite(requestedHitsPerPage) && requestedHitsPerPage > 0 ? String(requestedHitsPerPage) : '24'
  const categories = asArray(query.category).map((value) => value.trim()).filter(Boolean)
  const brands = asArray(query.brand).map((value) => value.trim()).filter(Boolean)
  const sizes = asArray(query.size).map((value) => value.trim()).filter(Boolean)
  const categoryField = categories.length ? 'categories_ids' : ''
  const priceMin = typeof query.priceMin === 'string' ? query.priceMin : null
  const priceMax = typeof query.priceMax === 'string' ? query.priceMax : null
  const vendorOverride = typeof query.vendor === 'string' ? query.vendor.trim() : ''
  const vendorId = vendorOverride ? vendorOverride : await getSelectedVendor(event)
  const normalizedVendor = vendorId.trim()
  const normalizedVendorLower = normalizedVendor.toLowerCase()

  const url = new URL(SEARCH_ENDPOINT)
  url.searchParams.set('index', SEARCH_INDEX)
  url.searchParams.set('text', text)
  url.searchParams.set('page', page)
  url.searchParams.set('hitsPerPage', hitsPerPage)

  if (categoryField && categories.length) {
    appendListFilter(url, categoryField, categories)
  }
  appendListFilter(url, 'brand', brands)
  if (sizes.length) {
    appendListFilter(url, 'size', sizes)
  }

  if (priceMin !== null || priceMax !== null) {
    if (priceMin !== null) {
      url.searchParams.append('filters[price][0][operator]', '>')
      url.searchParams.append('filters[price][0][value]', priceMin)
    }
    if (priceMax !== null) {
      url.searchParams.append('filters[price][1][operator]', '<')
      url.searchParams.append('filters[price][1][value]', priceMax)
    }
  }

  const upstreamUrl = url.toString()
  console.log('[Search] Fetching AB Tasty search', {
    endpoint: upstreamUrl,
    text,
    vendor: normalizedVendor || null,
    brands,
    categories,
    sizes,
    priceMin: priceMin ?? null,
    priceMax: priceMax ?? null
  })

  try {
    const response = await fetch(upstreamUrl)
    if (!response.ok) {
      const bodyText = await response.text()
      console.error('[ABTastySearch] upstream error', {
        status: response.status,
        body: bodyText
      })
      setResponseStatus(event, response.status, 'Upstream AB Tasty search error')
      return {
        error: true,
        statusCode: response.status,
        statusMessage: 'Upstream AB Tasty search error',
        url: upstreamUrl,
        body: bodyText
      }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const bodyText = await response.text()
      console.error('[ABTastySearch] unexpected content type', {
        contentType,
        body: bodyText
      })
      setResponseStatus(event, 502, 'Unexpected AB Tasty response')
      return {
        error: true,
        statusCode: 502,
        statusMessage: 'Unexpected AB Tasty response',
        url: upstreamUrl,
        body: bodyText
      }
    }

    const payload = await response.json()
    if (normalizedVendor && Array.isArray(payload?.hits)) {
      payload.hits = payload.hits.filter((hit: unknown) => {
        if (!hit || typeof hit !== 'object') return false
        const record = hit as Record<string, unknown>
        const vendorValue =
          typeof record.vendor === 'string'
            ? record.vendor
            : typeof record.vendorId === 'string'
              ? record.vendorId
              : ''
        return vendorValue.trim().toLowerCase() === normalizedVendorLower
      })
    }
    const hitCount = Array.isArray(payload?.hits) ? payload.hits.length : 0
    console.log('[Search] AB Tasty search response', {
      endpoint: upstreamUrl,
      hits: hitCount
    })

    if (normalizedVendor && hitCount === 0) {
      const config = useRuntimeConfig()
      const baseRaw = config.public?.productsApiBase || config.public?.apiBase || 'https://api.live-server1.com'
      const base = String(baseRaw).replace(/\/+$/, '')

      type RemotePagedResponse = RemoteResponse & { next_cursor?: string; nextCursor?: string }
      try {
        const remote = await fetchUpstreamJson<RemotePagedResponse>(
          base,
          `/vendors/${encodeURIComponent(normalizedVendor)}/products`,
          {
            params: {
              limit: Number.isFinite(requestedHitsPerPage) && requestedHitsPerPage > 0 ? requestedHitsPerPage : 24,
              ...(text !== '*' ? { q: text } : {}),
              ...(brands.length ? { brandId: brands[0] } : {}),
              ...(categories.length ? { categoryId: categories[0] } : {}),
              includeRaw: 'true'
            }
          }
        )

        const items = (remote?.data ?? remote?.products ?? []).map(normalizeRemoteProduct)
        const hits = items.map((product) => ({
          id: String(product.id),
          name: product.name,
          img_link: product.image,
          link: product.link || `/products/${encodeURIComponent(String(product.id))}`,
          price: product.price,
          price_before_discount: product.price_before_discount ?? null,
          discountPercentage: product.discountPercentage ?? null,
          sku: product.sku ?? null,
          size: product.sizes ?? [],
          brand: product.brand ?? null,
          vendor: product.vendor ?? normalizedVendor,
          category_id: product.category ?? null,
          categories_ids: product.categoryIds ?? []
        }))

        return {
          hits,
          totalPages: hits.length > 0 && (remote?.nextCursor ?? remote?.next_cursor) ? requestedPage + 2 : requestedPage + 1,
          totalHits: hits.length,
          hitsPerPage: Number.isFinite(requestedHitsPerPage) && requestedHitsPerPage > 0 ? requestedHitsPerPage : 24,
          page: Number.isFinite(requestedPage) && requestedPage >= 0 ? requestedPage : 0
        }
      } catch (fallbackError) {
        console.error('[ABTastySearch] vendor fallback failed', fallbackError)
      }
    }

    return payload
  } catch (error) {
    console.error('[ABTastySearch] request failed', error)
    setResponseStatus(event, 502, 'Failed to load AB Tasty search results')
    return {
      error: true,
      statusCode: 502,
      statusMessage: 'Failed to load AB Tasty search results',
      url: upstreamUrl,
      body: error instanceof Error ? error.message : String(error)
    }
  }
})

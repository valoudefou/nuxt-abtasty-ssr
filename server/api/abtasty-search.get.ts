import { createError } from '#imports'
import { getQuery, setResponseStatus } from 'h3'
import { getSelectedVendor } from '@/server/utils/vendors'

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
  const text = typeof query.text === 'string' ? query.text.trim() : ''

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A search query is required.'
    })
  }

  const page = typeof query.page === 'string' ? query.page : String(query.page ?? '0')
  const hitsPerPage =
    typeof query.hitsPerPage === 'string' ? query.hitsPerPage : String(query.hitsPerPage ?? '24')
  const categories = asArray(query.category).map((value) => value.trim()).filter(Boolean)
  const brands = asArray(query.brand).map((value) => value.trim()).filter(Boolean)
  const categoryField = categories.length ? 'categories_ids' : ''
  const priceMin = typeof query.priceMin === 'string' ? query.priceMin : null
  const priceMax = typeof query.priceMax === 'string' ? query.priceMax : null
  const vendorId = await getSelectedVendor(event)
  const normalizedVendor = vendorId.trim()
  const brandFilters = brands.length ? brands : normalizedVendor ? [normalizedVendor] : []

  const url = new URL(SEARCH_ENDPOINT)
  url.searchParams.set('index', SEARCH_INDEX)
  url.searchParams.set('text', text)
  url.searchParams.set('page', page)
  url.searchParams.set('hitsPerPage', hitsPerPage)

  if (categoryField && categories.length) {
    appendListFilter(url, categoryField, categories)
  }
  appendListFilter(url, 'brand', brandFilters)
  if (normalizedVendor) {
    appendListFilter(url, 'vendor', [normalizedVendor])
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

    return await response.json()
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

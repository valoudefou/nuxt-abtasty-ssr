import { createError } from '#imports'
import { getQuery } from 'h3'

const SEARCH_ENDPOINT = 'https://search-api.abtasty.com/search'
const SEARCH_INDEX = '47c5c9b4ee0a19c9859f47734c1e8200_Catalog'

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
  const categoryField =
    typeof query.categoryField === 'string' && query.categoryField.trim()
      ? query.categoryField.trim()
      : 'categories_ids'

  const categories = asArray(query.category).map((value) => value.trim()).filter(Boolean)
  const brands = asArray(query.brand).map((value) => value.trim()).filter(Boolean)
  const priceMin = typeof query.priceMin === 'string' ? query.priceMin : null
  const priceMax = typeof query.priceMax === 'string' ? query.priceMax : null

  const url = new URL(SEARCH_ENDPOINT)
  url.searchParams.set('index', SEARCH_INDEX)
  url.searchParams.set('text', text)
  url.searchParams.set('page', page)
  url.searchParams.set('hitsPerPage', hitsPerPage)

  for (const category of categories) {
    url.searchParams.append(`filters[${categoryField}][]`, category)
  }

  for (const brand of brands) {
    url.searchParams.append('filters[brand][]', brand)
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

  try {
    return await $fetch(url.toString())
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to load AB Tasty search results'
    })
  }
})

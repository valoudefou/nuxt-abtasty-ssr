import { createError } from '#imports'
import { useStorage } from 'nitropack/runtime'
import { getRequestHeader, readBody, setResponseHeader } from 'h3'

import {
  fetchSearchResultsRecommendations,
  type RecommendationResponse
} from '@/server/utils/recommendations'

type Body = {
  itemIds?: Array<string | number> | string | number | null
}

const PLACEMENT_ID = '46bb1c6d-4a94-49d1-b7a9-cd7f7c41e13f'

const normalizeArray = (value?: Array<string | number> | string | number | null) => {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter((entry) => entry.trim().length > 0)
  }
  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean)
  }
  if (typeof value === 'number') {
    return [String(value)]
  }
  return []
}

const cacheKeyFor = (payload: Record<string, unknown>) =>
  `reco-search:${Buffer.from(JSON.stringify(payload)).toString('base64url')}`

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  const itemIds = normalizeArray(body?.itemIds)

  if (itemIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing itemIds' })
  }

  const cacheKey = cacheKeyFor({ placementId: PLACEMENT_ID, itemIds })
  const storage = useStorage('reco')
  const now = Date.now()
  const shouldCache = !process.dev

  if (shouldCache) {
    const cached = await storage.getItem<{ payload: RecommendationResponse; expiresAt: number }>(
      cacheKey
    )
    if (cached && cached.expiresAt > now) {
      setResponseHeader(event, 'Cache-Control', 'private, max-age=0, stale-while-revalidate=60')
      setResponseHeader(event, 'X-Reco-Cache', 'HIT')
      return cached.payload
    }
  }

  const payload = await fetchSearchResultsRecommendations(
    {
      placementId: PLACEMENT_ID,
      searchResultIds: itemIds
    },
    event
  )

  if (shouldCache) {
    await storage.setItem(cacheKey, {
      payload,
      expiresAt: now + 1000 * 60
    })
  }

  const origin = getRequestHeader(event, 'origin')
  if (origin) {
    setResponseHeader(event, 'Vary', 'Origin')
  }
  setResponseHeader(event, 'Cache-Control', 'private, max-age=0, stale-while-revalidate=60')
  setResponseHeader(event, 'X-Reco-Cache', shouldCache ? 'MISS' : 'SKIP')
  return payload
})


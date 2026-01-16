import { useRuntimeConfig } from '#imports'

import { normalizeRemoteProduct, type RemoteResponse } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const term = typeof query.q === 'string' ? query.q.trim() : ''
  const requestStart = Date.now()

  if (!term) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A search query is required.',
      data: { error: 'Missing q parameter for product search.' }
    })
  }

  const config = useRuntimeConfig()
  const baseRaw = config.public?.productsApiBase || 'https://live-server1.vercel.app'
  const base = baseRaw.replace(/\/+$/, '')
  const response = await $fetch<RemoteResponse | RemoteResponse['products']>(
    `${base}/products/vendor/karkkainen/search`,
    {
      params: { q: term, limit: 2000 }
    }
  )

  const matches = (Array.isArray(response) ? response : response.products ?? []).map(normalizeRemoteProduct)

  console.info('[ProductsSearch]', {
    term,
    total: matches.length,
    durationMs: Date.now() - requestStart
  })

  return {
    products: matches
  }
})

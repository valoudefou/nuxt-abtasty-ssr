import { useRuntimeConfig } from '#imports'

import { normalizeRemoteProduct, type RemoteResponse } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const { category } = getRouterParams(event)

  if (!category) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A category parameter is required to filter products.'
    })
  }

  const config = useRuntimeConfig()
  const baseRaw = config.public?.productsApiBase || 'https://live-server1.vercel.app'
  const base = baseRaw.replace(/\/+$/, '')

  const decodedCategory = decodeURIComponent(category)
  const response = await $fetch<RemoteResponse | RemoteResponse['products']>(
    `${base}/products/vendor/karkkainen/category/${encodeURIComponent(decodedCategory)}`,
    {
      params: { limit: 2000 }
    }
  )
  const matches = (Array.isArray(response) ? response : response.products ?? []).map(normalizeRemoteProduct)

  if (matches.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `No products found in category "${category}"`,
      data: { error: `No products found in category "${category}"` }
    })
  }

  return {
    products: matches
  }
})

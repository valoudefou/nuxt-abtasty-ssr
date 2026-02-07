import type { EventHandler, H3Event } from 'h3'
import { createError, defineEventHandler, getQuery, getRouterParam, setResponseStatus } from 'h3'

type FetchRawResponse<T> = {
  status?: number
  statusText?: string
  _data: T
}

const handler: EventHandler = defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig()
  const publicConfig = config.public as Record<string, unknown> | undefined
  const baseURL =
    (typeof publicConfig?.checkoutsApiBase === 'string' && publicConfig.checkoutsApiBase.trim())
    || (typeof publicConfig?.ordersApiBase === 'string' && publicConfig.ordersApiBase.trim())
    || (typeof publicConfig?.productsApiBase === 'string' && publicConfig.productsApiBase.trim())
    || 'https://api.live-server1.com'

  const checkoutId = String(getRouterParam(event, 'checkoutId') || '').trim()
  const token = String(getQuery(event).token || '').trim()

  if (!checkoutId || !token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing checkoutId or token'
    })
  }

  try {
    const upstream = (await $fetch.raw<unknown>(`/checkouts/${encodeURIComponent(checkoutId)}`, {
      baseURL,
      method: 'GET',
      query: { token }
    })) as FetchRawResponse<unknown>

    if (typeof upstream.status === 'number') {
      setResponseStatus(event, upstream.status, upstream.statusText)
    }

    return upstream._data
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number; status?: number })?.statusCode
      ?? (error as { status?: number })?.status

    throw createError({
      statusCode: statusCode ?? 502,
      statusMessage: 'Checkouts service request failed'
    })
  }
})

export default handler

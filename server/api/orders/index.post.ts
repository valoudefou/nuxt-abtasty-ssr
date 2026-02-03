import { readBody } from 'h3'

import type { CreateOrderRequest, Order } from '@/types/order'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<CreateOrderRequest>(event)

  try {
    const upstream = await $fetch.raw<Order>('/orders', {
      baseURL: config.public.ordersApiBase,
      method: 'POST',
      body
    })

    const location = upstream.headers?.get?.('location') ?? upstream.headers?.get?.('Location')
    if (location) {
      setHeader(event, 'Location', location)
    }

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
      statusMessage: 'Orders service request failed'
    })
  }
})

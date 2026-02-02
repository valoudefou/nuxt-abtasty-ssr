import { readBody } from 'h3'

import type { CreateOrderRequest, Order } from '@/types/order'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<CreateOrderRequest>(event)

  try {
    return await $fetch<Order>('/orders', {
      baseURL: config.public.ordersApiBase,
      method: 'POST',
      body
    })
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


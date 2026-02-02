import { readBody } from 'h3'

import type { Order, OrderStatus } from '@/types/order'

type StatusBody = {
  status: OrderStatus
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const orderId = String(getRouterParam(event, 'orderId') ?? '').trim()

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing orderId' })
  }

  const body = await readBody<StatusBody>(event)

  try {
    return await $fetch<Order>(`/orders/${encodeURIComponent(orderId)}/status`, {
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


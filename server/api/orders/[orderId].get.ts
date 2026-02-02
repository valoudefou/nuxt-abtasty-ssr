import type { Order } from '@/types/order'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const orderId = String(getRouterParam(event, 'orderId') ?? '').trim()

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing orderId' })
  }

  try {
    return await $fetch<Order>(`/orders/${encodeURIComponent(orderId)}`, {
      baseURL: config.public.ordersApiBase
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


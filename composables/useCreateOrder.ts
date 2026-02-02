import type { CreateOrderRequest, Order } from '@/types/order'

export const useCreateOrder = () => {
  const creating = ref(false)
  const error = ref<string | null>(null)
  const data = ref<Order | null>(null)

  const create = async (payload: CreateOrderRequest) => {
    creating.value = true
    error.value = null

    try {
      const order = await $fetch<Order>('/api/orders', { method: 'POST', body: payload })
      data.value = order
      return order
    } catch (err) {
      const status = (err as { statusCode?: number; status?: number })?.statusCode
        ?? (err as { status?: number })?.status

      error.value = status ? `Failed to create order (HTTP ${status}).` : 'Failed to create order.'
      throw err
    } finally {
      creating.value = false
    }
  }

  return { create, creating, error, data }
}


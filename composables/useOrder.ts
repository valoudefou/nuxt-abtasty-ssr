import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { Order } from '@/types/order'

export const useOrder = (orderId: MaybeRefOrGetter<string>) => {
  const resolvedOrderId = computed(() => encodeURIComponent(toValue(orderId)))

  return useFetch<Order>(() => `/orders/${resolvedOrderId.value}`, {
    baseURL: '/api'
  })
}

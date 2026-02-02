import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { Order, OrderStatus } from '@/types/order'

export const useUpdateOrderStatus = (
  orderId: MaybeRefOrGetter<string>,
  status: MaybeRefOrGetter<OrderStatus>
) => {
  const config = useRuntimeConfig()
  const resolvedOrderId = computed(() => encodeURIComponent(toValue(orderId)))
  const body = computed(() => ({ status: toValue(status) }))

  return useFetch<Order>(() => `/orders/${resolvedOrderId.value}/status`, {
    baseURL: config.public.ordersApiBase,
    method: 'POST',
    body,
    immediate: false,
    watch: false
  })
}

export const orderStatuses = [
  'PLACED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
] as const

export type OrderStatus = (typeof orderStatuses)[number]

export type OrderStatusHistoryItem = {
  status: OrderStatus
  timestamp?: string
}

export type Order = {
  orderId: string
  status: OrderStatus
  statusHistory?: OrderStatusHistoryItem[]
} & Record<string, unknown>

export type OrderStatusSocketMessage = {
  orderId: string
  status: OrderStatus
}


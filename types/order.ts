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
  createdAt?: string
}

export type Order = {
  id: number
  publicId: string
  status: OrderStatus
  updatedAt?: string
  statusHistory?: OrderStatusHistoryItem[]
} & Record<string, unknown>

export type OrderStatusSocketMessage = {
  orderId: number
  status: OrderStatus
  event?: string
  order?: Order
}

export type CreateOrderResponse = Order & {
  confirmationUrl?: string
}

export type CreateOrderRequest = {
  idempotencyKey?: string
  customer: {
    name: string
    email: string
    address: string
  }
  items: Array<{
    product: {
      sku: string
      name: string
      price: number
    }
    quantity: number
  }>
}

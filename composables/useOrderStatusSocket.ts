import { orderStatuses, type Order, type OrderStatus, type OrderStatusSocketMessage } from '@/types/order'

type OrderStatusCallback = (message: OrderStatusSocketMessage) => void

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
let intentionallyClosed = false
const callbacks = new Set<OrderStatusCallback>()

const jitter = (baseMs: number) => Math.round(baseMs * (0.75 + Math.random() * 0.5))

const closeSocket = () => {
  intentionallyClosed = true
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  socket?.close()
  socket = null
}

const scheduleReconnect = (connect: () => void) => {
  if (reconnectTimer || intentionallyClosed) return

  const baseDelay = Math.min(30_000, 500 * 2 ** reconnectAttempts)
  const delay = jitter(baseDelay)
  reconnectAttempts += 1

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, delay)
}

export const useOrderStatusSocket = () => {
  const config = useRuntimeConfig()
  const latestStatus = useState<OrderStatusSocketMessage | null>('orders:latest-status', () => null)

  const connect = () => {
    if (!import.meta.client) return
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    intentionallyClosed = false
    socket = new WebSocket(config.public.ordersWsBase)

    socket.addEventListener('open', () => {
      reconnectAttempts = 0
    })

    socket.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as
          | Partial<OrderStatusSocketMessage>
          | { event?: string; orderId?: number | string; status?: string; order?: unknown }
          | null
        if (!parsed || typeof parsed !== 'object') return
        const orderIdRaw = (parsed as { orderId?: number | string }).orderId
        const statusRaw = (parsed as { status?: string }).status
        const orderId = typeof orderIdRaw === 'number' ? orderIdRaw : Number(orderIdRaw)
        if (!Number.isFinite(orderId)) return
        if (typeof statusRaw !== 'string') return
        if (!orderStatuses.includes(statusRaw as OrderStatus)) return

        const message: OrderStatusSocketMessage = {
          orderId,
          status: statusRaw as OrderStatus,
          event: (parsed as { event?: string }).event,
          order: ((parsed as { order?: unknown }).order as Order | undefined)
        }

        latestStatus.value = message
        for (const callback of callbacks) {
          try {
            callback(message)
          } catch (error) {
            console.error('[Orders WS] subscriber error', error)
          }
        }
      } catch (error) {
        console.warn('[Orders WS] invalid message', error)
      }
    })

    socket.addEventListener('close', () => {
      socket = null
      scheduleReconnect(connect)
    })

    socket.addEventListener('error', () => {
      socket?.close()
    })
  }

  const subscribe = (callback: OrderStatusCallback) => {
    callbacks.add(callback)
    connect()

    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        closeSocket()
      }
    }
  }

  return {
    latestStatus,
    subscribe
  }
}

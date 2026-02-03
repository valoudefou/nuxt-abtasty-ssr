import type { CreateOrderRequest, CreateOrderResponse } from '@/types/order'

export const useCreateOrder = () => {
  const creating = ref(false)
  const error = ref<string | null>(null)
  const data = ref<CreateOrderResponse | null>(null)

  const normalizeConfirmationUrl = (value?: string) => {
    const trimmed = value?.trim()
    if (!trimmed) return undefined
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    if (trimmed.startsWith('/')) return trimmed
    return `/${trimmed}`
  }

  const create = async (payload: CreateOrderRequest) => {
    creating.value = true
    error.value = null

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        error.value = `Failed to create order (HTTP ${response.status}).`
        throw new Error(`Failed to create order (HTTP ${response.status}).`)
      }

      const json = (await response.json()) as CreateOrderResponse | null
      const locationHeader = response.headers.get('Location') ?? response.headers.get('location')
      const confirmationUrl = normalizeConfirmationUrl(
        (json && typeof json === 'object' && typeof (json as { confirmationUrl?: unknown }).confirmationUrl === 'string')
          ? (json as { confirmationUrl: string }).confirmationUrl
          : (locationHeader?.trim() || undefined)
      )

      const next = {
        ...(json && typeof json === 'object' ? json : {}),
        ...(confirmationUrl ? { confirmationUrl } : {})
      } as CreateOrderResponse

      data.value = next
      return next
    } catch (err) {
      if (error.value) {
        throw err
      }
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

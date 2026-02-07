import { readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const publicConfig = config.public as Record<string, unknown> | undefined
  const baseURL =
    (typeof publicConfig?.checkoutsApiBase === 'string' && publicConfig.checkoutsApiBase.trim())
    || (typeof publicConfig?.ordersApiBase === 'string' && publicConfig.ordersApiBase.trim())
    || (typeof publicConfig?.productsApiBase === 'string' && publicConfig.productsApiBase.trim())
    || 'https://api.live-server1.com'

  try {
    const body = await readBody<unknown>(event).catch(() => undefined)
    const upstream = await $fetch.raw<unknown>('/checkouts', {
      baseURL,
      method: 'POST',
      body
    })

    if (typeof upstream.status === 'number') {
      setResponseStatus(event, upstream.status, upstream.statusText)
    }

    return upstream._data
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number; status?: number })?.statusCode
      ?? (error as { status?: number })?.status

    // If the upstream doesn't implement `/checkouts` (common in demos),
    // fall back to generating a local checkout session so the client-side
    // abandonment/email signals can still be exercised.
    if (statusCode === 404) {
      const checkoutId =
        (globalThis.crypto && 'randomUUID' in globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
          ? globalThis.crypto.randomUUID()
          : `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
      const checkoutToken =
        (globalThis.crypto && 'randomUUID' in globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
          ? globalThis.crypto.randomUUID()
          : `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`

      setResponseStatus(event, 200)
      return { checkoutId, checkoutToken }
    }

    throw createError({
      statusCode: statusCode ?? 502,
      statusMessage: 'Checkouts service request failed'
    })
  }
})

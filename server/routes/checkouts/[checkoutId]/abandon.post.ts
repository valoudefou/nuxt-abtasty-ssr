export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const publicConfig = config.public as Record<string, unknown> | undefined
  const baseURL =
    (typeof publicConfig?.checkoutsApiBase === 'string' && publicConfig.checkoutsApiBase.trim())
    || (typeof publicConfig?.ordersApiBase === 'string' && publicConfig.ordersApiBase.trim())
    || (typeof publicConfig?.productsApiBase === 'string' && publicConfig.productsApiBase.trim())
    || 'https://api.live-server1.com'

  const checkoutId = String(getRouterParam(event, 'checkoutId') || '').trim()
  const token = String(getQuery(event).token || '').trim()

  if (!checkoutId || !token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing checkoutId or token'
    })
  }

  try {
    const upstream = await $fetch.raw<unknown>(`/checkouts/${encodeURIComponent(checkoutId)}/abandon`, {
      baseURL,
      method: 'POST',
      query: { token }
    })

    if (typeof upstream.status === 'number') {
      setResponseStatus(event, upstream.status, upstream.statusText)
    }

    return upstream._data
  } catch {
    // Best-effort signal; do not propagate upstream errors to the browser during unload.
    setResponseStatus(event, 204)
    return null
  }
})

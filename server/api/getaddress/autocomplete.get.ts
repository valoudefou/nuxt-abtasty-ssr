export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = String(config.getAddress?.apiKey ?? '').trim()

  if (!apiKey) {
    throw createError({ statusCode: 501, statusMessage: 'GetAddress is not configured' })
  }

  const query = getQuery(event)
  const q = String((query.q ?? query.query ?? '')).trim()

  if (!q || q.length < 3) {
    return { suggestions: [] }
  }

  try {
    setHeader(event, 'Cache-Control', 'private, no-store')
    return await $fetch<{ suggestions?: Array<{ id: string; address: string }> }>(
      `https://api.getaddress.io/autocomplete/${encodeURIComponent(q)}`,
      {
        params: {
          'api-key': apiKey,
          all: 'true'
        }
      }
    )
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number; status?: number })?.statusCode
      ?? (error as { status?: number })?.status
    throw createError({ statusCode: statusCode ?? 502, statusMessage: 'GetAddress autocomplete failed' })
  }
})


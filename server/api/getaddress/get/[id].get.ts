export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = String(config.getAddress?.apiKey ?? '').trim()

  if (!apiKey) {
    throw createError({ statusCode: 501, statusMessage: 'GetAddress is not configured' })
  }

  const id = String(getRouterParam(event, 'id') ?? '').trim()
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  try {
    setHeader(event, 'Cache-Control', 'private, no-store')
    return await $fetch<{
      addresses?: Array<{
        formatted_address?: string[]
        line_1?: string
        line_2?: string
        line_3?: string
        town_or_city?: string
        county?: string
        postcode?: string
      }>
      postcode?: string
    }>(`https://api.getaddress.io/get/${encodeURIComponent(id)}`, {
      params: {
        'api-key': apiKey
      }
    })
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number; status?: number })?.statusCode
      ?? (error as { status?: number })?.status
    throw createError({ statusCode: statusCode ?? 502, statusMessage: 'GetAddress lookup failed' })
  }
})


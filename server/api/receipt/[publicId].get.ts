export default defineEventHandler(async (event) => {
  const publicId = String(getRouterParam(event, 'publicId') ?? '').trim()
  if (!publicId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing publicId' })
  }

  const config = useRuntimeConfig()
  const base =
    String(config.receiptApiBase || config.public.receiptApiBase || config.public.ordersApiBase || '').trim()

  if (!base) {
    throw createError({ statusCode: 501, statusMessage: 'Receipt service is not configured' })
  }

  const upstreamUrl = new URL(
    `/receipt/${encodeURIComponent(publicId)}`,
    base.endsWith('/') ? base : `${base}/`
  ).toString()

  try {
    const upstream = await $fetch.raw<ArrayBuffer>(upstreamUrl, {
      method: 'GET',
      responseType: 'arrayBuffer',
      headers: { accept: 'application/pdf' }
    })

    setHeader(event, 'Cache-Control', 'private, no-store')
    setHeader(event, 'Content-Type', upstream.headers?.get?.('content-type') || 'application/pdf')
    setHeader(event, 'Content-Disposition', `inline; filename="receipt-${publicId}.pdf"`)
    setHeader(event, 'X-Receipt-Upstream', upstreamUrl)

    if (typeof upstream.status === 'number') {
      setResponseStatus(event, upstream.status, upstream.statusText)
    }

    const data = upstream._data
    if (!data) {
      throw createError({ statusCode: 502, statusMessage: 'Receipt fetch returned an empty response' })
    }
    return Buffer.from(data)
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number; status?: number })?.statusCode
      ?? (error as { status?: number })?.status
    throw createError({ statusCode: statusCode ?? 502, statusMessage: 'Receipt fetch failed' })
  }
})

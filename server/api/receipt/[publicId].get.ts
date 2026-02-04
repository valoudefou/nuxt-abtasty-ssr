export default defineEventHandler(async (event) => {
  const publicId = String(getRouterParam(event, 'publicId') ?? '').trim()
  if (!publicId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing publicId' })
  }

  const upstreamUrl = `http://127.0.0.1:8082/receipt/${encodeURIComponent(publicId)}`

  let response: Response
  try {
    response = await fetch(upstreamUrl)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Receipt fetch failed' })
  }

  if (!response.ok) {
    throw createError({
      statusCode: response.status || 502,
      statusMessage: 'Receipt fetch failed'
    })
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `inline; filename="receipt-${publicId}.pdf"`)
  return buffer
})


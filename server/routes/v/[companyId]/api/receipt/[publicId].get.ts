export default defineEventHandler(async (event) => {
  const publicId = String(getRouterParam(event, 'publicId') ?? '').trim()
  if (!publicId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing publicId' })
  }

  setHeader(event, 'Cache-Control', 'private, no-store')
  setResponseStatus(event, 307)
  setHeader(event, 'Location', `/api/receipt/${encodeURIComponent(publicId)}`)
  return null
})


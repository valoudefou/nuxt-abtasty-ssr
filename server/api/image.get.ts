import { getQuery, setHeader } from 'h3'

const PLACEHOLDER = 'https://assets-manager.abtasty.com/placeholder.png'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = typeof query.url === 'string' ? query.url : ''

  if (!url) {
    return sendRedirect(event, PLACEHOLDER, 302)
  }

  try {
    const response = await fetch(url, { redirect: 'follow' })

    if (!response.ok || !response.body) {
      throw new Error(`Upstream error: ${response.status}`)
    }

    // Pass through content type when available
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    setHeader(event, 'Content-Type', contentType)
    // Cache for a short time to reduce repeated fetches
    setHeader(event, 'Cache-Control', 'public, max-age=600')

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error('Image proxy failed', err)
    return sendRedirect(event, PLACEHOLDER, 302)
  }
})

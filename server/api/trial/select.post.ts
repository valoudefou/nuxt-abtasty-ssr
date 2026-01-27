import { readBody, setCookie } from 'h3'

import { fetchVendors, VENDOR_COOKIE_NAME } from '@/server/utils/vendors'

type SelectBody = {
  vendor?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SelectBody>(event)
  const vendorId = body?.vendor ? String(body.vendor).trim() : ''

  const vendors = await fetchVendors({ fresh: true })
  const isValid = vendors.some((vendor) => vendor.id === vendorId)

  if (!vendorId || !isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid vendor',
      data: { ok: false, error: 'invalid_vendor' }
    })
  }

  setCookie(event, VENDOR_COOKIE_NAME, vendorId, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  })

  return { ok: true, vendor: vendorId }
})


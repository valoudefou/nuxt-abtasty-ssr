import { readBody, setCookie } from 'h3'

import { fetchVendors, VENDOR_COOKIE_NAME } from '@/server/utils/vendors'

type SelectBody = {
  vendor?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SelectBody>(event)
  const vendorId = body?.vendor ? String(body.vendor).trim() : ''
  const vendorIdLower = vendorId.toLowerCase()

  const vendors = await fetchVendors({ fresh: true })
  const match =
    vendors.find((vendor) => vendor.id === vendorId)
    || vendors.find((vendor) => vendor.name === vendorId)
    || vendors.find((vendor) => vendor.id.toLowerCase() === vendorIdLower)
    || vendors.find((vendor) => vendor.name.toLowerCase() === vendorIdLower)

  if (!vendorId || !match) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid vendor',
      data: { ok: false, error: 'invalid_vendor' }
    })
  }

  const canonicalId = match.id

  setCookie(event, VENDOR_COOKIE_NAME, canonicalId, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  })

  return { ok: true, vendor: canonicalId }
})

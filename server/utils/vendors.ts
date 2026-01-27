import { useRuntimeConfig } from '#imports'
import { getCookie } from 'h3'
import type { H3Event } from 'h3'

const DEFAULT_VENDOR_ID = ''
const VENDOR_COOKIE = 'abt_vendor'
const CACHE_TTL_MS = 1000 * 60 * 5

export type Vendor = {
  id: string
  name: string
}

type VendorCache = {
  vendors: Vendor[]
  fetchedAt: number
}

let cached: VendorCache | null = null

const getApiBase = () => {
  const config = useRuntimeConfig()
  const baseRaw = config.public?.apiBase || config.public?.productsApiBase || 'https://api.live-server1.com'
  return baseRaw.replace(/\/+$/, '')
}

const normalizeVendors = (payload: unknown): Vendor[] => {
  if (!payload) {
    return []
  }

  const list = Array.isArray(payload)
    ? payload
    : typeof payload === 'object' && payload && 'data' in payload
      ? (payload as { data?: unknown }).data
      : payload

  if (!Array.isArray(list)) {
    return []
  }

  return list
    .map((entry) => {
      const id = (entry as { id?: unknown })?.id
      const name = (entry as { name?: unknown })?.name
      if (!id || !name) {
        return null
      }
      const normalizedId = String(id).trim()
      const normalizedName = String(name).trim()
      if (!normalizedId || !normalizedName) {
        return null
      }
      return { id: normalizedId, name: normalizedName }
    })
    .filter((vendor): vendor is Vendor => Boolean(vendor))
}

export const fetchVendors = async (options: { fresh?: boolean } = {}): Promise<Vendor[]> => {
  const now = Date.now()
  if (!options.fresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.vendors
  }

  const base = getApiBase()

  try {
    const response = await $fetch(`${base}/vendors`, { params: { limit: 50 } })
    const vendors = normalizeVendors(response)
    if (vendors.length > 0) {
      cached = { vendors, fetchedAt: now }
      return vendors
    }
  } catch (error) {
    console.error('Failed to fetch vendors from upstream', error)
  }

  const fallback: Vendor[] = []
  cached = { vendors: fallback, fetchedAt: now }
  return fallback
}

export const getSelectedVendor = async (event?: H3Event): Promise<string> => {
  const contextVendor =
    event && (event as { context?: Record<string, unknown> }).context?.vendorId
      ? String((event as { context?: Record<string, unknown> }).context?.vendorId).trim()
      : ''
  const cookieValue = event ? getCookie(event, VENDOR_COOKIE) : undefined
  const candidate = contextVendor || (cookieValue ? String(cookieValue).trim() : '')
  if (!candidate) {
    return ''
  }

  const vendors = await fetchVendors()
  if (vendors.length === 0) {
    // In dev or when the upstream vendor list is unavailable, trust the cookie value.
    return candidate
  }
  const isValid = vendors.some((vendor) => vendor.id === candidate)
  return isValid ? candidate : ''
}

export const DEFAULT_VENDOR = DEFAULT_VENDOR_ID
export const VENDOR_COOKIE_NAME = VENDOR_COOKIE

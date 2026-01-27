import { useRuntimeConfig } from '#imports'
import { getSelectedVendor } from '@/server/utils/vendors'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseRaw = config.public?.apiBase || config.public?.productsApiBase || 'https://api.live-server1.com'
  const base = baseRaw.replace(/\/+$/, '')
  const vendorId = await getSelectedVendor(event)

  try {
    const response = await $fetch<{ data?: Array<{ id?: string | null }> }>(
      `${base}/vendors/${encodeURIComponent(vendorId)}/categories`,
      { params: { limit: 500 } }
    )
    return (response?.data ?? [])
      .map((item) => String(item?.id ?? '').trim())
      .filter(Boolean)
  } catch (error) {
    console.error('Failed to load product categories from upstream', error)
    return []
  }
})

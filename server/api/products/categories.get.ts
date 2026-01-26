import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const baseRaw = config.public?.apiBase || config.public?.productsApiBase || 'https://api.live-server1.com'
  const base = baseRaw.replace(/\/+$/, '')
  const vendorId = config.public?.productsVendorId ? String(config.public.productsVendorId).trim() : ''

  try {
    const response = await $fetch<{ data?: Array<{ id?: string | null }> }>(`${base}/categories`, {
      params: vendorId ? { vendorId, limit: 500 } : { limit: 500 }
    })
    return (response?.data ?? [])
      .map((item) => String(item?.id ?? '').trim())
      .filter(Boolean)
  } catch (error) {
    console.error('Failed to load product categories from upstream', error)
    return []
  }
})

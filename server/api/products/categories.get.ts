import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const baseRaw = config.public?.productsApiBase || 'https://api.live-server1.com'
  const base = baseRaw.replace(/\/+$/, '')

  try {
    return await $fetch<string[]>(`${base}/products/categories`)
  } catch (error) {
    console.error('Failed to load product categories from upstream', error)
    return []
  }
})

import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const baseRaw = config.public?.productsApiBase || 'https://live-server1.vercel.app'
  const base = baseRaw.replace(/\/+$/, '')

  return await $fetch<string[]>(`${base}/products/vendor/karkkainen/categories`, {
    params: { limit: 2000 }
  })
})

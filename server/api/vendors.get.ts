import { fetchVendors } from '@/server/utils/vendors'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const fresh = String(query.fresh ?? '') === '1'
  const vendors = await fetchVendors({ fresh })
  return { data: vendors }
})


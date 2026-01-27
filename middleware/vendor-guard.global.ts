export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/trial')) {
    return
  }

  const cookieVendor = useCookie<string | null>('abt_vendor').value
  if (cookieVendor && String(cookieVendor).trim()) {
    return
  }

  if (import.meta.client) {
    const stored = localStorage.getItem('abt_vendor')
    if (stored && stored.trim()) {
      return
    }
  }

  return navigateTo({
    path: '/trial',
    query: { redirect: to.fullPath }
  })
})


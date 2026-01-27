const DEFAULT_VENDOR = ''

const resetVendorScopedState = () => {
  // Category page state
  useState('category-products', () => []).value = []
  useState('product-categories', () => []).value = []
  useState('category-brands', () => []).value = []
  useState('selected-category', () => 'All').value = 'All'
  useState('selected-brand', () => 'All').value = 'All'
  useState('category-search-query', () => '').value = ''
  useState('category-page', () => 1).value = 1
  useState('category-next-cursor', () => ({})).value = {}
  useState('category-page-cache', () => ({})).value = {}
  useState('category-include-facets', () => true).value = true
  useState('category-total-pages', () => 1).value = 1

  // Home/brand page state
  useState('products', () => []).value = []
  useState('all-products', () => []).value = []
  useState('product-brands', () => []).value = []
  useState('product-search-query', () => '').value = ''
  useState('product-search-results', () => []).value = []
  useState('has-fetched-products', () => false).value = false
}

export default defineNuxtRouteMiddleware((to) => {
  const paramVendor = typeof to.params.companyId === 'string' ? to.params.companyId.trim() : ''
  if (paramVendor) {
    const vendorCookie = useCookie<string | null>('abt_vendor')
    if (vendorCookie.value !== paramVendor) {
      vendorCookie.value = paramVendor
    }
    const event = useRequestEvent()
    if (event) {
      ;(event as { context?: Record<string, unknown> }).context = {
        ...(event as { context?: Record<string, unknown> }).context,
        vendorId: paramVendor
      }
    }
    if (import.meta.client) {
      localStorage.setItem('abt_vendor', paramVendor)
    }
  }

  if (to.path.startsWith('/trial')) {
    return
  }

  const cookieVendor = useCookie<string | null>('abt_vendor').value
  const cookieValue = cookieVendor ? String(cookieVendor).trim() : ''

  let localValue = ''
  if (import.meta.client) {
    localValue = (localStorage.getItem('abt_vendor') || '').trim()
  }

  const currentVendor = paramVendor || cookieValue || localValue
  if (!currentVendor) {
    return navigateTo('/trial')
  }

  if (!paramVendor && !to.path.startsWith('/c/')) {
    const suffix = to.fullPath === '/' ? '' : to.fullPath
    return navigateTo(`/c/${encodeURIComponent(currentVendor)}${suffix}`)
  }

  const activeVendor = useState<string>('active-vendor', () => currentVendor || DEFAULT_VENDOR)
  const previousVendor = activeVendor.value
  if (previousVendor !== currentVendor) {
    activeVendor.value = currentVendor
    if (import.meta.client) {
      resetVendorScopedState()
    }
  }
})

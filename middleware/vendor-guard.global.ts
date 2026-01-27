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
  if (to.path.startsWith('/trial')) {
    return
  }

  const cookieVendor = useCookie<string | null>('abt_vendor').value
  const cookieValue = cookieVendor ? String(cookieVendor).trim() : ''

  let localValue = ''
  if (import.meta.client) {
    localValue = (localStorage.getItem('abt_vendor') || '').trim()
  }

  const currentVendor = cookieValue || localValue
  if (!currentVendor) {
    return navigateTo('/trial')
  }

  if (import.meta.client) {
    const activeVendor = useState<string>('active-vendor', () => currentVendor || DEFAULT_VENDOR)
    if (activeVendor.value !== currentVendor) {
      activeVendor.value = currentVendor
      resetVendorScopedState()
    }
  }
})

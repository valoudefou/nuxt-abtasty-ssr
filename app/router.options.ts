import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    // Always reset to the top on navigation so product pages don’t open at a scrolled position.
    return { top: 0, left: 0 }
  }
}

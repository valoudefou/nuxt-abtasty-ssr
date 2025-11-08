import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehaviorType: 'auto',
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    const isBrandRoute =
      to.matched.some((record) => record.path === '/:brand?') &&
      from?.matched?.some((record) => record.path === '/:brand?')

    if (isBrandRoute) {
      return false
    }

    return { left: 0, top: 0 }
  }
}

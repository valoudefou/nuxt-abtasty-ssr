export default defineNuxtRouteMiddleware((to) => {
  // Only apply to product detail routes.
  if (to.path.startsWith('/products/')) {
    const param = Array.isArray(to.params.id) ? to.params.id.join('-') : String(to.params.id ?? '')
    const match = param.match(/(\d+)(?!.*\d)/)

    if (match && match[1] !== param) {
      return navigateTo(`/products/${match[1]}`, { replace: true, redirectCode: 301 })
    }
  }
})

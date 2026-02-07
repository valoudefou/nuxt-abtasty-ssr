// https://nuxt.com/docs/api/configuration/nuxt-config
const env =
  ((globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env) ||
  {}

const extractRecommendationId = (input?: string) => {
  if (!input) return undefined
  try {
    const url = new URL(input)
    const segments = url.pathname.split('/').filter(Boolean)
    return segments.at(-1)
  } catch {
    return undefined
  }
}

const normalizeEnvBool = (value?: string) => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const recommendationEndpoints = {
  brand:
    env.NUXT_RECOMMENDATIONS_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/8d1ea373-571f-4d08-a9bf-04dda16383c2',
  category:
    env.NUXT_RECOMMENDATIONS_CATEGORY_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/85d0d2f8-2d66-4d1d-a376-80b4e6d5692c',
  cart:
    env.NUXT_RECOMMENDATIONS_CART_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/4fcf5e25-ea4e-4fea-90de-31860d544b00',
  viewed:
    env.NUXT_RECOMMENDATIONS_VIEWED_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/020a5437-d72f-49ee-a720-880f05c17c1e',
  homepage:
    env.NUXT_RECOMMENDATIONS_HOMEPAGE_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/c019fa56-8e90-4a62-9873-d43a40e110c8'
}

const defaultRecommendationFields = JSON.stringify([
  'beforePrice',
  'price',
  'discountPercentage',
  'name',
  'img_link',
  'absolute_link',
  'sku',
  'size'
])

const withRecommendationFields = (endpoint: string) => {
  try {
    const url = new URL(endpoint)
    if (!url.searchParams.has('fields')) {
      url.searchParams.set('fields', defaultRecommendationFields)
    }
    return url.toString()
  } catch {
    return endpoint
  }
}

const defaultStrategyNames = {
  brand: env.NUXT_RECOMMENDATIONS_BRAND_NAME || 'Personalized picks',
  homepage: env.NUXT_RECOMMENDATIONS_HOMEPAGE_NAME || 'Homepage inspiration',
  category: env.NUXT_RECOMMENDATIONS_CATEGORY_NAME || 'Category highlights',
  cart_products: env.NUXT_RECOMMENDATIONS_CART_NAME || 'Cart recommendations',
  viewed_items: env.NUXT_RECOMMENDATIONS_VIEWED_NAME || 'Recently viewed'
} as const

const defaultStrategyIds = {
  brand: extractRecommendationId(recommendationEndpoints.brand),
  homepage: extractRecommendationId(recommendationEndpoints.homepage),
  category: extractRecommendationId(recommendationEndpoints.category),
  cart_products: extractRecommendationId(recommendationEndpoints.cart),
  viewed_items: extractRecommendationId(recommendationEndpoints.viewed)
} as const

const abTastyScriptSrc = String(
  env.NUXT_ABTASTY_SCRIPT_SRC
  || env.NUXT_PUBLIC_ABTASTY_SCRIPT_SRC
  || ''
).trim()
const abTastyEnabled = abTastyScriptSrc
  ? !normalizeEnvBool(env.NUXT_ABTASTY_DISABLED || env.NUXT_PUBLIC_ABTASTY_DISABLED)
  : false

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Commerce Demo',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Modern e-commerce demo built with Nuxt 3 showcasing a responsive storefront, product detail pages, and a shopping cart experience.'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://dev.visualwebsiteoptimizer.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
        }
      ],
      script: [
        ...(abTastyEnabled
          ? [{
            src: abTastyScriptSrc,
            type: 'text/javascript'
          }]
          : [])
      ]
    }
  },
  css: ['@/assets/css/tailwind.css'],
  modules: ['@nuxtjs/tailwindcss'],
  routeRules: {
    // Cache public storefront pages at the edge to reduce Vercel SSR compute (/__fallback).
    '/': { swr: 300 },
    '/products/**': { swr: 300 },
    '/categories/**': { swr: 300 },
    '/brands/**': { swr: 300 },
    '/valentines-day': { swr: 300 },
    '/trial': { swr: 300 },

    // Never cache user-specific flows.
    '/cart': { headers: { 'cache-control': 'private, no-store' } },
    '/checkout': { headers: { 'cache-control': 'private, no-store' } },
    '/orders': { headers: { 'cache-control': 'private, no-store' } },
    '/orders/**': { headers: { 'cache-control': 'private, no-store' } },
    '/order-confirmation': { ssr: false, headers: { 'cache-control': 'private, no-store' } },
    '/order-confirmation/**': { ssr: false, headers: { 'cache-control': 'private, no-store' } },

    // Product APIs are cached server-side (see server/utils/products.ts).
    // Avoid edge caching here to prevent caching oversized-header errors (413) across users.
    '/api/vendors': { swr: 3600 },
    '/api/valentines-products': { swr: 300 },
    '/api/recommendations': { swr: 120 },

    // Receipts can contain personal/order info; never cache.
    '/api/receipt/**': { headers: { 'cache-control': 'private, no-store' } },

    // Company-scoped storefront pages.
    // Use `*` for the companyId segment and keep `**` only at the end to produce valid Vercel route regexes.
    '/v/*': { swr: 120 },
    '/v/*/products/**': { swr: 300 },
    '/v/*/categories': { swr: 300 },
    '/v/*/brands/**': { swr: 300 },
    '/v/*/valentines-day': { swr: 300 },
    '/v/*/trial': { swr: 300 },

    '/v/companyId/*': { swr: 120 },
    '/v/companyId/*/products/**': { swr: 300 },
    '/v/companyId/*/categories': { swr: 300 },
    '/v/companyId/*/brands/**': { swr: 300 },
    '/v/companyId/*/valentines-day': { swr: 300 },
    '/v/companyId/*/trial': { swr: 300 },

    // Company-scoped user-specific flows.
    '/v/*/cart': { headers: { 'cache-control': 'private, no-store' } },
    '/v/*/checkout': { headers: { 'cache-control': 'private, no-store' } },
    '/v/*/orders': { headers: { 'cache-control': 'private, no-store' } },
    '/v/*/orders/**': { headers: { 'cache-control': 'private, no-store' } },
    '/v/*/order-confirmation': { ssr: false, headers: { 'cache-control': 'private, no-store' } },
    '/v/*/order-confirmation/**': { ssr: false, headers: { 'cache-control': 'private, no-store' } },
    '/v/*/api/receipt/**': { headers: { 'cache-control': 'private, no-store' } },

    '/v/companyId/*/cart': { headers: { 'cache-control': 'private, no-store' } },
    '/v/companyId/*/checkout': { headers: { 'cache-control': 'private, no-store' } },
    '/v/companyId/*/orders': { headers: { 'cache-control': 'private, no-store' } },
    '/v/companyId/*/orders/**': { headers: { 'cache-control': 'private, no-store' } },
    '/v/companyId/*/order-confirmation': { ssr: false, headers: { 'cache-control': 'private, no-store' } },
    '/v/companyId/*/order-confirmation/**': { ssr: false, headers: { 'cache-control': 'private, no-store' } },
    '/v/companyId/*/api/receipt/**': { headers: { 'cache-control': 'private, no-store' } }
  },
  runtimeConfig: {
    receiptApiBase:
      env.NUXT_RECEIPT_API_BASE
      || env.NUXT_PUBLIC_RECEIPT_API_BASE
      || env.NUXT_RECEIPT_BASE
      || 'https://receipt.live-server1.com',
    flagship: {
      envId: env.NUXT_FLAGSHIP_ENV_ID || '',
      apiKey: env.NUXT_FLAGSHIP_API_KEY || ''
    },
    getAddress: {
      apiKey: env.NUXT_GETADDRESS_KEY || ''
    },
    recommendations: {
      debug: env.NUXT_RECOMMENDATIONS_DEBUG || '',
      apiKey:
        env.NUXT_RECOMMENDATIONS_API_KEY
        || env.NUXT_ABTASTY_KEY
        || env.NUXT_ABTASTY_API_KEY
        || '',
      endpoint: withRecommendationFields(recommendationEndpoints.brand),
      categoryEndpoint: withRecommendationFields(recommendationEndpoints.category),
      cartEndpoint: withRecommendationFields(recommendationEndpoints.cart),
      viewedItemsEndpoint: withRecommendationFields(recommendationEndpoints.viewed),
      homepageEndpoint: withRecommendationFields(recommendationEndpoints.homepage),
      accountId: env.NUXT_ABTASTY_ACCOUNT || '',
      siteUrl: env.NUXT_RECOMMENDATIONS_SITE_URL || env.NUXT_PUBLIC_SITE_URL || 'https://val-commerce-demo.vercel.app',
      strategyNames: defaultStrategyNames,
      strategyIds: defaultStrategyIds
    },
    public: {
      companyName: 'Commerce Demo',
      supportEmail: 'hello@commerce.demo',
      ordersApiBase: 'https://order.live-server1.com',
      ordersWsBase: 'wss://order.live-server1.com/ws/orders',
      receiptApiBase:
        env.NUXT_PUBLIC_RECEIPT_API_BASE
        || env.NUXT_RECEIPT_API_BASE
        || 'https://receipt.live-server1.com',
      apiBase: env.NUXT_PUBLIC_API_BASE || '',
      // Checkout lifecycle (start/abandon) endpoint. Set this to your Java service base URL if needed.
      // Example: NUXT_PUBLIC_CHECKOUTS_API_BASE="https://checkout-java.yourdomain.com"
      checkoutsApiBase:
        env.NUXT_PUBLIC_CHECKOUTS_API_BASE
        || env.NUXT_CHECKOUTS_API_BASE
        || 'https://order.live-server1.com'
        || env.NUXT_PUBLIC_API_BASE
        || env.NUXT_API_BASE
        || 'https://api.live-server1.com',
      productsApiBase:
        env.NUXT_PRODUCTS_API_BASE
        || env.NUXT_PUBLIC_API_BASE
        || env.NUXT_API_BASE
        || 'https://api.live-server1.com',
      productsVendorId:
        env.NUXT_PUBLIC_PRODUCTS_VENDOR_ID
        || env.NUXT_PRODUCTS_VENDOR_ID
        || 'karkkainen',
      productsDisableRemote: env.NUXT_PRODUCTS_DISABLE_REMOTE === 'true',
      flagship: {
        envId: env.NUXT_FLAGSHIP_ENV_ID || '',
        apiKey: env.NUXT_FLAGSHIP_API_KEY || ''
      },
      siteUrl: env.NUXT_PUBLIC_SITE_URL || 'https://val-commerce-demo.vercel.app',
      recommendations: {
        debug: env.NUXT_RECOMMENDATIONS_DEBUG || '',
        strategyNames: defaultStrategyNames,
        strategyIds: defaultStrategyIds
      },
      getAddress: {
        enabled: Boolean(env.NUXT_GETADDRESS_KEY)
      }
    }
  },
  nitro: {
    compatibilityDate: '2026-02-04'
  },
  vite: {
    resolve: {
      alias: {
        '#app-manifest': new URL('./utils/appManifestStub.ts', import.meta.url).pathname,
        // Stub React Native AsyncStorage for web builds to avoid optional dependency resolution errors
        '@react-native-async-storage/async-storage': new URL(
          './utils/asyncStorageShim.ts',
          import.meta.url
        ).pathname
      }
    }
  },
  typescript: {
    typeCheck: true
  }
})

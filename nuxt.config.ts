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

const recommendationEndpoints = {
  brand:
    env.NUXT_RECOMMENDATIONS_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/8d1ea373-571f-4d08-a9bf-04dda16383c2?fields=%5B%22price%22%2C%22name%22%2C%22img_link%22%2C%22absolute_link%22%5D',
  category:
    env.NUXT_RECOMMENDATIONS_CATEGORY_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/85d0d2f8-2d66-4d1d-a376-80b4e6d5692c?fields=%5B%22price%22%2C%22name%22%2C%22img_link%22%2C%22absolute_link%22%5D',
  cart:
    env.NUXT_RECOMMENDATIONS_CART_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/4fcf5e25-ea4e-4fea-90de-31860d544b00?fields=%5B%22price%22%2C%22name%22%2C%22img_link%22%2C%22absolute_link%22%5D',
  viewed:
    env.NUXT_RECOMMENDATIONS_VIEWED_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/020a5437-d72f-49ee-a720-880f05c17c1e?fields=%5B%22price%22%2C%22name%22%2C%22img_link%22%2C%22absolute_link%22%5D',
  homepage:
    env.NUXT_RECOMMENDATIONS_HOMEPAGE_ENDPOINT
    || 'https://uc-info.eu.abtasty.com/v1/reco/1031/recos/c019fa56-8e90-4a62-9873-d43a40e110c8?fields=%5B%22price%22%2C%22name%22%2C%22img_link%22%2C%22absolute_link%22%5D'
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
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
        }
      ],
      script: [
        {
          src: 'https://try.abtasty.com/1ceff369b6cd9aceaa9ee318e6498167.js',
          type: 'text/javascript'
        }
      ]
    }
  },
  css: ['@/assets/css/tailwind.css'],
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    flagship: {
      envId: env.NUXT_FLAGSHIP_ENV_ID || '',
      apiKey: env.NUXT_FLAGSHIP_API_KEY || ''
    },
    getAddress: {
      apiKey: env.NUXT_GETADDRESS_KEY || ''
    },
    recommendations: {
      apiKey:
        env.NUXT_RECOMMENDATIONS_API_KEY
        || env.NUXT_ABTASTY_KEY
        || env.NUXT_ABTASTY_API_KEY
        || '',
      endpoint: recommendationEndpoints.brand,
      categoryEndpoint: recommendationEndpoints.category,
      cartEndpoint: recommendationEndpoints.cart,
      viewedItemsEndpoint: recommendationEndpoints.viewed,
      homepageEndpoint: recommendationEndpoints.homepage,
      accountId: env.NUXT_ABTASTY_ACCOUNT || '',
      siteUrl: env.NUXT_RECOMMENDATIONS_SITE_URL || env.NUXT_PUBLIC_SITE_URL || 'https://val-commerce-demo.vercel.app',
      strategyNames: defaultStrategyNames,
      strategyIds: defaultStrategyIds
    },
    public: {
      companyName: 'Commerce Demo',
      supportEmail: 'hello@commerce.demo',
      productsApiBase: env.NUXT_PRODUCTS_API_BASE || 'https://live-server1.vercel.app',
      productsDisableRemote: env.NUXT_PRODUCTS_DISABLE_REMOTE === 'true',
      flagship: {
        envId: env.NUXT_FLAGSHIP_ENV_ID || '',
        apiKey: env.NUXT_FLAGSHIP_API_KEY || ''
      },
      siteUrl: env.NUXT_PUBLIC_SITE_URL || 'https://val-commerce-demo.vercel.app',
      recommendations: {
        strategyNames: defaultStrategyNames,
        strategyIds: defaultStrategyIds
      },
      getAddress: {
        apiKey: env.NUXT_GETADDRESS_KEY || ''
      }
    }
  },
  nitro: {
    compatibilityDate: '2025-11-04'
  },
  vite: {
    resolve: {
      alias: {
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

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Val Commerce',
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
      ]
    }
  },
  css: ['@/assets/css/tailwind.css'],
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      companyName: 'Val Commerce',
      supportEmail: 'hello@valcommerce.demo'
    }
  },
  nitro: {
    preset: 'vercel'
  },
  typescript: {
    typeCheck: true
  }
})

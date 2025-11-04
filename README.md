# Val Commerce Demo

A modern ecommerce experience built with [Nuxt 3](https://nuxt.com) and [Vue 3](https://vuejs.org). The demo showcases a high-end apparel brand with product listings, detailed product pages, a persistent cart, editorial storytelling, and marketing capture moments. The project is configured to deploy easily to [Vercel](https://vercel.com/).

## Features

- ⚡️ Nuxt 3 with server routes that expose product data for the storefront
- 🎨 Responsive Tailwind CSS design with reusable Vue components
- 🛒 Persistent cart composable with add, update, and remove capabilities
- 📚 Editorial storytelling and marketing sections to show brand narrative
- ☁️ Ready-to-deploy configuration for Vercel hosting

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

3. Build for production:

   ```bash
   npm run build
   ```

4. Preview the production build locally:

   ```bash
   npm run preview
   ```

## Deployment on Vercel

The project includes a `vercel.json` file and Nuxt Nitro configuration to target the Vercel runtime. To deploy:

1. Push the repository to GitHub (or your preferred Git provider).
2. Import the project into Vercel and select the repository.
3. Use the default build command (`npm run build`) and install command (`npm install`).
4. Vercel will detect the Nuxt framework, build the application, and provision serverless functions automatically.

## Project structure

```
├── app.vue
├── assets/
├── components/
├── composables/
├── data/
├── layouts/
├── pages/
├── public/
├── server/
├── types/
├── nuxt.config.ts
└── vercel.json
```

Feel free to adapt the content, styling, and data model to suit your own brand.

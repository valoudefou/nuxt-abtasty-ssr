<img src="https://content.partnerpage.io/eyJidWNrZXQiOiJwYXJ0bmVycGFnZS5wcm9kIiwia2V5IjoibWVkaWEvY29udGFjdF9pbWFnZXMvMDUwNGZlYTYtOWIxNy00N2IyLTg1YjUtNmY5YTZjZWU5OTJiLzI1NjhmYjk4LTQwM2ItNGI2OC05NmJiLTE5YTg1MzU3ZjRlMS5wbmciLCJlZGl0cyI6eyJ0b0Zvcm1hdCI6IndlYnAiLCJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6NjI3LCJmaXQiOiJjb250YWluIiwiYmFja2dyb3VuZCI6eyJyIjoyNTUsImciOjI1NSwiYiI6MjU1LCJhbHBoYSI6MH19fX0=" alt="AB Tasty logo" width="350"/>

# Nuxt 3 Commerce Demo

A modern ecommerce experience built with [Nuxt 3](https://nuxt.com) and [Vue 3](https://vuejs.org). The demo showcases a high-end apparel brand with product listings, detailed product pages, a persistent cart, editorial storytelling, and marketing capture moments.

## Features

- ⚡️ Nuxt 3 with server routes that expose product data for the storefront
- 🎨 Responsive Tailwind CSS design with reusable Vue components
- 🛒 Persistent cart composable with add, update, and remove capabilities
- 📚 Editorial storytelling and marketing sections to show brand narrative
- 🌍 Server-rendered architecture ready for Node, serverless, or edge runtimes
- 🧪 Feature flagging with Flagship, pre-rendered on the server and revalidated client-side without UI flicker

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

## Environment variables

Make sure to create a local `.env` file before running the project. The file is ignored by Git and should contain at least the Flagship credentials:

```
NUXT_FLAGSHIP_ENV_ID=your-flagship-environment-id
NUXT_FLAGSHIP_API_KEY=your-flagship-api-key
```

## Nuxt 3 architecture

This project uses Nuxt 3’s hybrid rendering model:

- **File-based routing** powers both pages and server APIs (`pages/` and `server/api/`).
- **Nitro server** handles server-side rendering, API routes, and deployment portability across Node, serverless, or edge platforms.
- **Composables** under `composables/` provide reusable logic (cart management, products fetching, etc.).
- **TypeScript-first** configuration with full type checking (`vue-tsc`) ensures editor support and safe refactors.

Key Nuxt configuration highlights (`nuxt.config.ts`):

- Tailwind CSS integration via the official Nuxt module.
- Runtime configuration (`runtimeConfig`) to expose private and public Flagship credentials.
- SSR enabled by default, allowing server routes to run during page rendering.

## AB Tasty feature flag integration

AB Tasty drives the “Apple Pay” quick checkout button on product pages. The integration has two layers to guarantee a fast, flicker-free experience while keeping the SSR response and hydrated client in sync:

1. **Server-side evaluation (SSR)**  
   - Nuxt renders the page by calling `GET /api/features/apple-pay`.
   - The endpoint boots the shared Flagship SDK (`server/utils/flagship/index.ts`), derives a visitor ID from cookies (creating one if needed), and fetches the `paymentFeature1Click` flag.
   - It returns `{ enabled: boolean }`, and the page reads that value through `useFetch` during setup. Because this happens before the response leaves the server, the HTML already reflects the correct Apple Pay state with no flash of incorrect UI.

2. **Client-side confirmation**  
   - After hydration, the page optionally revalidates via `initializeFlagship` in `utils/flagship/index.ts`, a browser-safe helper that reads the public runtime config.
   - The helper starts the client SDK once, reuses the same visitor context, and fetches the latest flags.
   - The reactive state updates only if a value changes mid-session; otherwise the server-supplied state persists without any perceptible update.

### How the helper bridges SSR and the client

- `server/utils/flagship/index.ts` exposes `initializeFlagship` for server code. It caches the SDK instance, handles credential lookup (private runtime config first, public fallback), and fetches flags.
- `utils/flagship/index.ts` mirrors the API for the browser. It guards against SSR usage, boots the client SDK once, and shares the same visitor/context signature so values stay aligned.
- `pages/products/[slug].vue` calls the server endpoint inside `useFetch` during setup, then invokes the browser helper inside `onMounted`. The Apple Pay button simply reacts to a `ref`, so both phases share the same codepath.
- Because the button state is derived from a single source of truth, the UI remains stable and any flag flip propagates immediately without reloads.
- Every client visitor is initialised with a minimal context (`status: 'returning', system: 'ios'`) so AB Tasty audiences can target Apple Pay availability or experiment variants by segment without extra plumbing.

### Interaction tracking

- Apple Pay taps are tracked through Flagship’s hit helper: when the CTA is pressed we call `visitor.sendHit` with `HitType.EVENT`, `EventCategory.USER_ENGAGEMENT`, and the action `"Click Apple Pay"` using the product slug as the label. The call bundles into the standard Flagship/AB Tasty batch payload (e.g. `ec: "User Engagement", ea: "Click Apple Pay", el: "<product-slug>", ev: 1`) that you can inspect in the log panel or your AB Tasty dashboard.
- The event fires before any business logic runs, ensuring every attempt (including those blocked because the flag is disabled or the item is out of stock) is reported.

### Server Flagship bootstrap (`server/utils/flagship/index.ts`)

```ts
import { Flagship, LogLevel, Visitor } from '@flagship.io/js-sdk'
import { useRuntimeConfig } from '#imports'
import { createError } from 'h3'

import { flagshipLogManager } from '@/utils/flagship/logManager'
import { flagshipLogStore } from '@/utils/flagship/logStore'

type InitializeFlagshipOptions = {
  visitorId: string
  context?: Record<string, string | number | boolean>
  authenticated?: boolean
}

let flagshipStarted = false

const ensureFlagshipStarted = () => {
  if (flagshipStarted) return

  const config = useRuntimeConfig()
  const flagshipConfig = (config.flagship ?? {}) as { envId?: string; apiKey?: string }
  const publicFlagship = (config.public?.flagship ?? {}) as { envId?: string; apiKey?: string }
  const envId = flagshipConfig.envId || publicFlagship.envId
  const apiKey = flagshipConfig.apiKey || publicFlagship.apiKey

  if (!envId || !apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Flagship credentials are missing. Please configure runtimeConfig.flagship.'
    })
  }

  Flagship.start(envId, apiKey, {
    fetchNow: false,
    logManager: flagshipLogManager,
    logLevel: LogLevel.ALL
  })

  flagshipStarted = true
}

export const initializeFlagship = async ({
  visitorId,
  context = {},
  authenticated = false
}: InitializeFlagshipOptions): Promise<Visitor> => {
  if (!visitorId) {
    throw createError({ statusCode: 400, statusMessage: 'A visitorId is required to initialize Flagship.' })
  }

  ensureFlagshipStarted()

  const visitor = Flagship.newVisitor({
    visitorId,
    hasConsented: true,
    context,
    isAuthenticated: authenticated
  })

  await visitor.fetchFlags()

  return visitor
}

export { flagshipLogStore }
```

- `ensureFlagshipStarted` guards the singleton SDK instance, reads both private and public runtime config, and throws a typed `createError` if credentials are missing so Nuxt surfaces a 500 with context.
- When the SDK boots we attach the custom `flagshipLogManager`, enabling structured logs (with redacted secrets) to flow into the in-app log panel alongside native console output.
- `initializeFlagship` normalises the visitor payload, enforces that a `visitorId` is supplied, fetches flags, and returns the hydrated `Visitor` instance that server routes can use for evaluations or hit tracking.
- The module re-exports `flagshipLogStore` so downstream code can push supplementary diagnostics into the same stream.

### Product page usage (`pages/products/[slug].vue`)

The product detail page consumes the shared helpers and explains the decisions inline:

```ts
import { initializeFlagship } from '@/utils/flagship'
import { flagshipLogStore } from '@/utils/flagship/logStore'

// SSR hands us the initial decision via /api/features/apple-pay.
const applePayEnabled = ref(Boolean(applePayFeature.value?.enabled))

const runFlagship = async () => {
  const visitor = await initializeFlagship({
    // Stable slug-based ID keeps server/client evaluations aligned.
    visitorId: route.params.slug ? `visitor-${route.params.slug}` : 'guest',
    context: {
      status: 'returning'
    }
  })

  const flag = visitor.getFlag('paymentFeature1Click')
  const rawValue = flag.getValue('false')
  const enabled =
    typeof rawValue === 'string' ? rawValue.trim().toLowerCase() === 'true' : Boolean(rawValue)

  applePayEnabled.value = enabled

  flagshipLogStore.addLog({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    tag: 'flagship-client',
    message: `paymentFeature1Click evaluated to ${enabled}`,
    visitorId: visitor.visitorId,
    rawValue,
    enabled
  })
}
```

- The import comment highlights that the browser helper mirrors the server bootstrap, guaranteeing consistent runtime config and logging.
- `applePayEnabled` is initialised with the SSR evaluation so the HTML the user receives already reflects the correct state; the client helper simply reaffirms it.
- The visitor payload reuses the slug when possible, falling back to a guest identifier, and ships a minimal context (`status: 'returning'`) so audience targeting rules remain stable.
- `paymentFeature1Click` returns a string flag; the component normalises it to a boolean before toggling the ref that drives the Apple Pay CTA.
- Every evaluation writes to the shared `flagshipLogStore`, so the bottom log panel captures both the raw value and the interpreted decision for debugging.

Logging and sanitisation:

- Custom log manager redacts sensitive data before storing messages.
- Structured logs (visitor ID, flag value, SDK status) are emitted in development for observability.

## Brand Filtering API - Implementation Guide

### Overview

This guide covers the brand filtering capabilities added to the Nuxt products API. The implementation exposes the available brands, supports case-insensitive filtering, and keeps responses consistent on both the server and client.

### Date Implemented

- November 6th, 2025

### New Endpoints

#### 1. Get All Brands

- **Endpoint:** `GET /api/products/brands`
- **Description:** Returns all unique, non-empty brand names from the current product catalog.

**Request**

```
GET /api/products/brands
```

**Response**

```json
{
  "brands": ["Nike", "Adidas", "Puma", "Reebok"]
}
```

**Status Codes**

- `200 OK` – Successfully retrieved brand list.
- `500 Internal Server Error` – Failed to build the data set.

**Implementation details**

- Builds the brand list from cached product data (`fetchProductBrands` in `server/utils/products.ts`).
- Filters out null, undefined, or empty values before returning.
- Trims whitespace while preserving original casing (e.g. `"Nike"` not `"nike"`).
- Implemented in `server/api/products/brands.get.ts`, which must be evaluated before the dynamic product slug route to avoid conflicts.

```ts
// server/api/products/brands.get.ts
import { fetchProductBrands } from '@/server/utils/products'

export default defineEventHandler(async () => {
  const brands = await fetchProductBrands()

  return {
    brands
  }
})
```

#### 2. Filter Products by Brand

- **Endpoint:** `GET /api/products/brand/:brand`
- **Description:** Retrieves every product that matches the supplied brand name.

**Request**

```
GET /api/products/brand/nike
```

**Response**

```json
{
  "products": [
    {
      "id": 123,
      "title": "Nike Air Max",
      "brand": "Nike",
      "category": "Shoes"
    }
  ]
}
```

**Status Codes**

- `200 OK` – Successfully filtered products.
- `404 Not Found` – No products matched the requested brand.
- `500 Internal Server Error` – Unexpected failure while filtering.

**Implementation details**

- Uses `findProductsByBrand` from `server/utils/products.ts` to perform case-insensitive comparisons.
- Returns a structured 404 error (via `createError`) when no records are found, aligning with the JSON shape `{ "error": "No products found for brand \"<brand>\"" }`.
- Input brands are trimmed before comparison, ensuring `" Nike "` matches `"Nike"`.

```ts
// server/api/products/brand/[brand].get.ts
import { findProductsByBrand } from '@/server/utils/products'

export default defineEventHandler(async (event) => {
  const { brand } = getRouterParams(event)

  if (!brand) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A brand parameter is required to filter products.'
    })
  }

  const products = await findProductsByBrand(brand)

  if (products.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `No products found for brand "${brand}"`,
      data: { error: `No products found for brand "${brand}"` }
    })
  }

  return {
    products
  }
})
```

### Complete API Endpoint Summary

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/products` | GET | Retrieve all products (supports existing limit/query logic). |
| `/api/products/:slug` | GET | Retrieve a specific product by slug. |
| `/api/products/brands` | GET | List all unique brands. |
| `/api/products/brand/:brand` | GET | Filter products by brand name. |

### Route Order

Nuxt’s file-based routing ensures the correct order when folders are structured as follows:

```
server/api/products/
├── brand/[brand].get.ts
├── brands.get.ts
├── index.get.ts
└── [slug].get.ts
```

Defining static brand routes ahead of the dynamic `[slug]` handler prevents accidental matches (e.g. `brand` resolving as a slug).

### Usage Examples

- `curl -X GET "http://localhost:3000/api/products/brands"`
- `curl -X GET "http://localhost:3000/api/products/brand/nike"`
- `curl -X GET "http://localhost:3000/api/products/brand/adidas"`

### Testing Checklist

- [ ] Verify `/api/products/brands` returns all unique brands.
- [ ] Confirm brand names preserve original casing.
- [ ] Test `/api/products/brand/:brand` with various casing (Nike, NIKE, nike).
- [ ] Validate a non-existent brand responds with HTTP 404.
- [ ] Ensure products without brand values are excluded from results.
- [ ] Confirm whitespace in brand names is handled correctly.
- [ ] Check that request logging (if enabled) still succeeds for both endpoints.

### Design Pattern

- Mirrors the category filtering approach: a listing endpoint (`/brands`) plus a focused filter (`/brand/:brand`).
- Case-insensitive matching for user-friendly queries.
- Consistent response structures and error handling across product routes.

### Future Enhancements

- Support multi-brand filtering (e.g. `/api/products?brands=nike,adidas`).
- Add brand metadata (logo assets, descriptions, etc.).
- Implement brand search/autocomplete.
- Introduce brand aliases or variations.
- Provide pagination for large brand catalogs.

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
└── nuxt.config.ts
```

Feel free to adapt the content, styling, and data model to suit your own brand.

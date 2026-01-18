<template>
  <div class="space-y-16">
    <transition v-if="productLoading" name="product-loader">
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-white/75 px-6 py-10 backdrop-blur-sm"
      >
        <div class="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-6 shadow-xl">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
              <div class="flex items-center gap-1">
                <span class="product-loader-dot h-2 w-2 rounded-full bg-sky-500"></span>
                <span class="product-loader-dot h-2 w-2 rounded-full bg-emerald-500"></span>
                <span class="product-loader-dot h-2 w-2 rounded-full bg-amber-500"></span>
              </div>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">Loading product details</p>
              <p class="mt-1 text-sm text-slate-600">
                Fetching data from the demo catalog. This may take a moment.
              </p>
            </div>
          </div>
          <div class="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div class="product-loader-bar h-full w-1/2 bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400"></div>
          </div>
        </div>
      </div>
    </transition>

    <p
      v-else-if="productError"
      class="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700"
    >
      We were unable to load this product. Please try again later.
    </p>

    <div v-else class="space-y-16">
    <div class="grid gap-16 lg:grid-cols-[1.2fr,1fr]">
      <div>
      <div class="overflow-hidden rounded-3xl bg-white shadow-xl">
        <img :src="product.image" :alt="product.name" class="h-[32rem] w-full object-cover" />
      </div>
      <section class="mt-12">
        <h2 class="text-2xl font-semibold text-slate-900">Product details</h2>
        <p class="mt-4 text-sm leading-7 text-slate-600">{{ product.description }}</p>
        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Highlights</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-600">
              <li v-for="highlight in product.highlights" :key="highlight" class="flex items-start gap-2">
                <CheckCircleIcon class="mt-1 h-5 w-5 flex-shrink-0 text-primary-500" />
                <span>{{ highlight }}</span>
              </li>
            </ul>
          </div>
          <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Care</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-600">
              <li>Machine wash cold with like colors.</li>
              <li>Tumble dry low or hang dry for longevity.</li>
              <li>Do not bleach. Warm iron if needed.</li>
            </ul>
          </div>
        </div>
      </section>
      </div>
      <aside class="space-y-8">
      <div class="sticky top-24 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <NuxtLink to="/" class="inline-flex items-center text-sm font-semibold text-primary-600">
          <ArrowLeftIcon class="mr-2 h-4 w-4" />
          Back to catalog
        </NuxtLink>
        <h1 class="mt-6 text-3xl font-semibold text-slate-900">{{ product.name }}</h1>
        <p class="mt-3 text-lg font-semibold text-primary-600">{{ formatCurrency(product.price) }}</p>
        <p class="mt-4 text-sm leading-6 text-slate-600">
          Crafted for movement and comfort. All materials sourced from certified sustainable mills.
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <span v-for="color in product.colors" :key="color" class="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {{ color }}
          </span>
        </div>
        <button
          class="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-md font-semibold text-white shadow-lg transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!product.inStock"
          @click="addToCart"
        >
          <ShoppingCartIcon class="mr-3 h-8 w-5" />
          {{ product.inStock ? 'Add to cart' : 'Sold out' }}
        </button>
        <button
          v-if="applePayEnabled"
          class="apple-pay-button mt-4"
          type="button"
          :disabled="!product.inStock"
          @click="beginApplePay"
        >
          <span aria-hidden="true" class="apple-pay-button__fallback">
            <span class="apple-pay-button__fallback-label">Buy with</span>
            <span class="apple-pay-button__icon">
              <svg
                viewBox="-76.79115 -52.55 665.5233 315.3"
                xmlns="http://www.w3.org/2000/svg"
                focusable="false"
                role="presentation"
              >
                <path
                  fill="currentColor"
                  d="M93.541 27.1c-6 7.1-15.6 12.7-25.2 11.9-1.2-9.6 3.5-19.8 9-26.1 6-7.3 16.5-12.5 25-12.9 1 10-2.9 19.8-8.8 27.1m8.7 13.8c-13.9-.8-25.8 7.9-32.4 7.9-6.7 0-16.8-7.5-27.8-7.3-14.3.2-27.6 8.3-34.9 21.2-15 25.8-3.9 64 10.6 85 7.1 10.4 15.6 21.8 26.8 21.4 10.6-.4 14.8-6.9 27.6-6.9 12.9 0 16.6 6.9 27.8 6.7 11.6-.2 18.9-10.4 26-20.8 8.1-11.8 11.4-23.3 11.6-23.9-.2-.2-22.4-8.7-22.6-34.3-.2-21.4 17.5-31.6 18.3-32.2-10-14.8-25.6-16.4-31-16.8m80.3-29v155.9h24.2v-53.3h33.5c30.6 0 52.1-21 52.1-51.4s-21.1-51.2-51.3-51.2zm24.2 20.4h27.9c21 0 33 11.2 33 30.9s-12 31-33.1 31h-27.8zm129.8 136.7c15.2 0 29.3-7.7 35.7-19.9h.5v18.7h22.4V90.2c0-22.5-18-37-45.7-37-25.7 0-44.7 14.7-45.4 34.9h21.8c1.8-9.6 10.7-15.9 22.9-15.9 14.8 0 23.1 6.9 23.1 19.6v8.6l-30.2 1.8c-28.1 1.7-43.3 13.2-43.3 33.2 0 20.2 15.7 33.6 38.2 33.6zm6.5-18.5c-12.9 0-21.1-6.2-21.1-15.7 0-9.8 7.9-15.5 23-16.4l26.9-1.7v8.8c0 14.6-12.4 25-28.8 25zm82 59.7c23.6 0 34.7-9 44.4-36.3l42.5-119.2h-24.6l-28.5 92.1h-.5l-28.5-92.1h-25.3l41 113.5-2.2 6.9c-3.7 11.7-9.7 16.2-20.4 16.2-1.9 0-5.6-.2-7.1-.4v18.7c1.4.4 7.4.6 9.2.6z"
                />
              </svg>
            </span>
          </span>
          <span class="sr-only">Buy now with Apple Pay</span>
        </button>

        <p v-if="!product.inStock" class="mt-4 text-sm text-slate-500">Join the waitlist to be notified once this item returns.</p>
      </div>
      <div class="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
        <h2 class="text-base font-semibold text-slate-900">Shipping & returns</h2>
        <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>Complimentary carbon-neutral shipping on orders over $200.</li>
          <li>Free returns within 30 days for unused products.</li>
          <li>Lifetime repairs covered through our care program.</li>
        </ul>
      </div>
    </aside>
    </div>

    <ClientOnly>
      <section v-if="viewedProductIds.length" class="lg:col-span-2">
        <h2 class="text-xl font-semibold text-slate-900">Because you viewed these</h2>
        <p class="mt-2 text-sm text-slate-600">Hand-picked picks inspired by your browsing.</p>
        <div class="mt-8">
          <RecommendationsCarousel
            filter-field="viewed_items"
            :filter-value="viewedProductIds"
            :viewing-item-id="product.id"
            :cart-product-ids="cartProductIds"
          />
        </div>
      </section>
    </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EventCategory, HitType, type Visitor } from '@flagship.io/js-sdk'
import { ArrowLeftIcon, CheckCircleIcon, ShoppingCartIcon } from '@heroicons/vue/24/solid'
import RecommendationsCarousel from '@/components/RecommendationsCarousel.vue'
// Client-side Flagship helper mirrors the server bootstrap so the SDK picked up during SSR
// is re-used in the browser with identical runtime config and logging behaviour.
import { initializeFlagship, logFlagExposureToLooker } from '@/utils/flagship'
import { flagshipLogStore } from '@/utils/flagship/logStore'
import type { Product } from '@/types/product'

definePageMeta({
  middleware: 'product-canonical'
})

const route = useRoute()
const cart = useCart()
const notifications = useNotifications()
const { findById } = useProducts()
const { viewedProducts, addViewedProduct } = useViewedProducts()

const { data: applePayFeature } = await useFetch<{ enabled: boolean }>('/api/features/apple-pay', {
  server: true,
  default: () => ({ enabled: false })
})

const { data: productData, pending: productLoading, error: productError } = await useAsyncData<Product>(
  () => `product-${route.params.id}`,
  () => findById(route.params.id as string),
  { watch: [() => route.params.id] }
)

const product = computed(() => productData.value as Product)

// applePayEnabled starts with the server-evaluated flag so SSR HTML and hydration match;
// subsequent client checks overwrite it if the visitor’s decision changes.
const applePayEnabled = ref(Boolean(applePayFeature.value?.enabled))
const flagshipVisitor = ref<Visitor | null>(null)
const viewedProductIds = viewedProducts
const cartProductIds = computed(() => cart.items.value.map((item) => item.id))

const logTimestamp = () =>
  new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

const runFlagship = async () => {
  if (!import.meta.client) return

  try {
    const visitor = await initializeFlagship({
      // Use a stable slug-based visitor identifier when available so server & client requests
      // address the same Flagship profile; fall back to a guest for products without a slug.
      visitorId: crypto.randomUUID(),
      context: {
        // Flagship context travels with every evaluation, allowing targeting rules
        // (e.g. "returning" customers) to remain consistent between SSR and the browser.
        status: 'returning',
        system: 'ios'
      }
    })

    // paymentFeature1Click toggles whether the "Buy with Apple Pay" CTA is presented.
    // Flagship serialises flag values as strings, so we normalise the response to a boolean.
    const flag = visitor.getFlag('paymentFeature1Click')
    const rawValue = flag.getValue('false')
    const flagEnabled =
      typeof rawValue === 'string' ? rawValue.trim().toLowerCase() === 'true' : Boolean(rawValue)

    // The Apple Pay button is driven entirely by this ref; toggling it reacts the UI instantly
    // without reloading the page.
    applePayEnabled.value = flagEnabled
    flagshipVisitor.value = visitor

    // Capture Looker-style exposure logs (including metadata like variation name) so the
    // "L" panel reflects the exact payload we would send to Looker.
      logFlagExposureToLooker(
      visitor.getFlags(),
      {
        info: (msg, meta) => console.info(msg, meta)
      },
      {
        visitorId: visitor.visitorId,
        anonymousId: visitor.anonymousId ?? undefined,
        extraProps: { page: 'product', productSlug: product.value?.slug }
      }
    )

    console.log('Flagship paymentFeature1Click flag', {
      visitorId: visitor.visitorId,
      rawValue,
      enabled: flagEnabled
    })

    flagshipLogStore.addLog({
      timestamp: logTimestamp(),
      level: 'INFO',
      tag: 'flagship-client',
      message: `paymentFeature1Click evaluated to ${flagEnabled ? 'true' : 'false'}`,
      visitorId: visitor.visitorId,
      rawValue,
      enabled: flagEnabled
    })
  } catch (error) {
    console.error('Failed to evaluate Flagship paymentFeature1Click flag', error)

    flagshipLogStore.addLog({
      timestamp: logTimestamp(),
      level: 'ERROR',
      tag: 'flagship-client',
      message: 'Failed to evaluate paymentFeature1Click flag',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

if (import.meta.client) {
  onMounted(() => {
    runFlagship()
    if (product.value) {
      addViewedProduct(product.value.id)
    }
  })
}

const addToCart = () => {
  if (!product.value?.inStock) return
  cart.addItem(product.value)
}

const trackApplePayClick = async () => {
  if (!import.meta.client) return

  const visitor = flagshipVisitor.value

  if (!visitor) {
    flagshipLogStore.addLog({
      timestamp: logTimestamp(),
      level: 'WARNING',
      tag: 'flagship-client',
      message: 'Skipped Apple Pay click tracking because Flagship visitor is unavailable'
    })
    return
  }
const hit = HitType.EVENT;
  try {
    await visitor.sendHit({
      type: HitType.EVENT,
      category: EventCategory.USER_ENGAGEMENT,
      action: 'Click Apple Pay',
      label: product.value?.slug ?? '',
      value: 1
    })

    flagshipLogStore.addLog({
      timestamp: logTimestamp(),
      level: 'INFO',
      tag: 'flagship-client',
      message: 'Tracked Apple Pay click hit',
      action: 'Click Apple Pay',
      label: product.value?.slug ?? ''
    })
  } catch (error) {
    console.error('Failed to send Flagship Apple Pay click hit', error)

    flagshipLogStore.addLog({
      timestamp: logTimestamp(),
      level: 'ERROR',
      tag: 'flagship-client',
      message: 'Failed to track Apple Pay click hit',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

const beginApplePay = async () => {
  await trackApplePayClick()

  if (!applePayEnabled.value) {
    notifications.show({
      title: 'Apple Pay unavailable',
      message: 'Apple Pay checkout is currently disabled.'
    })
    return
  }

  if (!product.value?.inStock) {
    notifications.show({
      title: 'Unavailable',
      message: 'This product is currently out of stock.'
    })
    return
  }

  if (typeof window !== 'undefined' && 'ApplePaySession' in window) {
    notifications.show({
      title: 'Apple Pay',
      message: 'Apple Pay checkout is coming soon. In the meantime, use the cart for checkout.'
    })
    return
  }

  notifications.show({
    title: 'Apple Pay unavailable',
    message: 'Apple Pay requires Safari on a compatible Apple device.'
  })
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

useHead({ title: computed(() => `${product.value?.name ?? 'Product'} – Commerce Demo`) })
</script>

<style scoped>
.product-loader-dot {
  animation: product-loader-bounce 1.2s ease-in-out infinite;
}

.product-loader-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.product-loader-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.product-loader-bar {
  animation: product-loader-bar 1.6s ease-in-out infinite;
}

@keyframes product-loader-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@keyframes product-loader-bar {
  0% {
    transform: translateX(-60%);
  }
  100% {
    transform: translateX(120%);
  }
}

.product-loader-enter-active,
.product-loader-leave-active {
  transition: opacity 200ms ease;
}

.product-loader-enter-from,
.product-loader-leave-to {
  opacity: 0;
}
</style>

<style scoped>
.apple-pay-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 3.25rem;
  gap: 0.5rem;
  border-radius: 9999px;
  background-color: #000;
  color: #fff;
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  appearance: none;
}

.apple-pay-button:is(:hover, :focus-visible) {
  background-color: #111;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.apple-pay-button:active {
  transform: translateY(0);
  box-shadow: none;
}

.apple-pay-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.apple-pay-button__fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.apple-pay-button__icon {
  display: inline-flex;
  align-items: center;
}

.apple-pay-button__icon svg {
  width: 4rem;
  height: 4rem;
  fill: currentColor;
}

.apple-pay-button__fallback-label {
  font-family: 'SF Pro Display', 'SF Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  letter-spacing: 0.02em;
  line-height: 1.2;
}
</style>

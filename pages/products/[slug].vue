<template>
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
        <div class="mt-6">
          <label class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Size</label>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="size in product.sizes"
              :key="size"
              :class="[
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                selectedSize === size
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600'
              ]"
              @click="selectedSize = size"
            >
              {{ size }}
            </button>
          </div>
        </div>
        <button
          class="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!product.inStock"
          @click="addToCart"
        >
          <ShoppingCartIcon class="mr-3 h-5 w-5" />
          {{ product.inStock ? 'Add to cart' : 'Sold out' }}
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
</template>

<script setup lang="ts">
import { ArrowLeftIcon, CheckCircleIcon, ShoppingCartIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const cart = useCart()
const { findBySlug } = useProducts()

const product = await findBySlug(route.params.slug as string)

const selectedSize = ref(product.sizes[0])

const addToCart = () => {
  if (!product.inStock) return
  cart.addItem(product)
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

useHead({ title: `${product.name} – Val Commerce` })
</script>

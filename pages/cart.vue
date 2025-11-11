<template>
  <div class="grid gap-16 lg:grid-cols-[2fr,1fr]">
    <section>
      <h1 class="text-3xl font-semibold text-slate-900">Your cart</h1>
      <p class="mt-3 text-sm text-slate-600">
        Review your selected items before heading to checkout. We offer free shipping on orders over $200.
      </p>

      <div v-if="!items.length" class="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <ShoppingBagIcon class="mx-auto h-12 w-12 text-slate-300" />
        <h2 class="mt-6 text-xl font-semibold text-slate-900">Your cart is empty</h2>
        <p class="mt-3 text-sm text-slate-600">Explore our latest arrivals and add something you love.</p>
        <NuxtLink to="/" class="mt-6 inline-flex items-center rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm">
          Continue shopping
        </NuxtLink>
      </div>

      <ul v-else class="mt-10 space-y-6">
        <li v-for="item in items" :key="item.id" class="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:gap-8">
          <img :src="item.image" :alt="item.name" class="h-32 w-32 rounded-2xl object-cover" />
          <div class="flex-1">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">{{ item.name }}</h2>
              </div>
              <p class="text-lg font-semibold text-primary-600">{{ formatCurrency(item.price) }}</p>
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-4">
              <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quantity</label>
              <div class="flex items-center rounded-full border border-slate-200">
                <button class="px-3 py-1 text-sm" @click="decrease(item.id)">−</button>
                <span class="px-4 text-sm font-medium text-slate-700">{{ item.quantity }}</span>
                <button class="px-3 py-1 text-sm" @click="increase(item.id)">+</button>
              </div>
              <button class="text-sm font-semibold text-rose-500" @click="remove(item.id)">Remove</button>
            </div>
          </div>
        </li>
      </ul>

    </section>

    <aside class="space-y-6">
      <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <h2 class="text-xl font-semibold text-slate-900">Order summary</h2>
        <dl class="mt-6 space-y-4 text-sm text-slate-600">
          <div class="flex items-center justify-between">
            <dt>Subtotal</dt>
            <dd class="font-semibold text-slate-900">{{ formatCurrency(subtotal) }}</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt>Shipping</dt>
            <dd>Calculated at checkout</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt>Estimated tax</dt>
            <dd>—</dd>
          </div>
        </dl>
        <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>{{ formatCurrency(subtotal) }}</span>
        </div>
        <NuxtLink
          to="/checkout"
          class="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-primary-500 disabled:bg-slate-300"
          :class="{ 'pointer-events-none opacity-60': !items.length }"
        >
          Proceed to checkout
        </NuxtLink>
        <p class="mt-4 text-xs text-slate-500">Secure payment powered by trusted partners.</p>
      </div>
      <div class="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
        <h3 class="text-sm font-semibold text-slate-900">Need assistance?</h3>
        <p class="mt-2 text-sm text-slate-600">
          Email our team at <a :href="`mailto:${config.public.supportEmail}`" class="font-semibold text-primary-600">{{ config.public.supportEmail }}</a> for tailored recommendations.
        </p>
      </div>
    </aside>
    <section class="lg:col-span-2">
      <h2 class="text-xl font-semibold text-slate-900">Because you added these</h2>
      <p class="mt-2 text-sm text-slate-600">Inspired picks based on what is currently in your bag.</p>
      <div class="mt-8">
        <RecommendationsCarousel
          :filter-field="'cart_products'"
          :filter-value="cartProductIds"
          :cart-categories="cartCategories"
          :added-to-cart-product-id="addedToCartProductId"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ShoppingBagIcon } from '@heroicons/vue/24/outline'

import RecommendationsCarousel from '@/components/RecommendationsCarousel.vue'

const config = useRuntimeConfig()
const { items, subtotal, updateQuantity, removeItem } = useCart()
const cartProductIds = computed(() => items.value.map((item) => item.id))
const cartCategories = computed(() => {
  const seen = new Set<string>()
  for (const item of items.value) {
    const category = item.category?.trim()
    if (category) {
      seen.add(category)
    }
  }
  return Array.from(seen)
})
const addedToCartProductId = computed(() => {
  const ids = cartProductIds.value
  return ids.length ? ids[ids.length - 1] : null
})

const increase = (id: number) => {
  const item = items.value.find((product) => product.id === id)
  if (!item) return
  updateQuantity(id, item.quantity + 1)
}

const decrease = (id: number) => {
  const item = items.value.find((product) => product.id === id)
  if (!item) return
  const nextQuantity = Math.max(1, item.quantity - 1)
  updateQuantity(id, nextQuantity)
}

const remove = (id: number) => removeItem(id)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

useHead({ title: 'Your cart – Val Commerce' })
</script>

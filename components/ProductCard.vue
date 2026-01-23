<template>
  <div class="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
    <NuxtLink :to="product.link || `/products/${product.id}`" class="relative block overflow-hidden rounded-2xl bg-slate-100">
      <img :src="product.image" :alt="product.name" class="h-64 w-full object-cover transition duration-500 group-hover:scale-105" />
      <div v-if="!product.inStock" class="absolute inset-0 flex items-center justify-center bg-black/40">
        <span class="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900">Sold out</span>
      </div>
    </NuxtLink>
    <div class="mt-6 flex flex-1 flex-col">
      <div class="flex items-start justify-between gap-4">
        <NuxtLink :to="product.link || `/products/${product.id}`" class="text-lg font-semibold text-slate-900">
          {{ product.name }}
        </NuxtLink>
        <div class="text-right">
          <p class="text-lg font-semibold text-primary-600">
            {{ formatCurrency(product.price) }}
          </p>
          <p v-if="product.sku" class="mt-1 text-xs font-medium text-slate-500">
            SKU {{ product.sku }}
          </p>
        </div>
      </div>
      <NuxtLink
        :to="product.link || `/products/${product.id}`"
        class="mt-3 block text-sm leading-6 text-slate-600"
      >
        <span class="line-clamp-3">
          {{ product.description }}
        </span>
      </NuxtLink>
      <div class="mt-4 flex items-center gap-2 text-xs font-medium text-amber-500">
        <StarIcon v-for="index in 5" :key="index" :class="index <= Math.round(product.rating) ? 'fill-amber-400' : 'fill-slate-200'" class="h-4 w-4" />
        <span class="text-slate-500">({{ product.rating.toFixed(1) }})</span>
      </div>
      <div class="mt-6 flex flex-wrap gap-2">
        <span
          v-for="color in product.colors"
          :key="color"
          class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
        >
          {{ color }}
        </span>
      </div>
      <div class="mt-8 flex gap-3">
        <button
          class="inline-flex flex-1 items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!product.inStock"
          @click="addToCart"
        >
          <ShoppingCartIcon class="mr-2 h-5 w-5" />
          <span class="hidden sm:inline">{{ product.inStock ? 'Add to cart' : 'Notify me' }}</span>
          <span class="sr-only sm:hidden">{{ product.inStock ? 'Add to cart' : 'Notify me' }}</span>
        </button>
        <NuxtLink
          :to="product.link || `/products/${product.id}`"
          class="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
        >
          View details
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShoppingCartIcon, StarIcon } from '@heroicons/vue/24/solid'
import type { Product } from '@/types/product'

const props = defineProps<{ product: Product }>()

const cart = useCart()

const addToCart = () => {
  if (!props.product.inStock) return
  cart.addItem(props.product)
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
</script>

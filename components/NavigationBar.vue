<template>
  <header class="fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur">
    <nav class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="flex items-center gap-2 text-xl font-semibold text-primary-600">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <ShoppingBagIcon class="h-6 w-6" />
        </span>
        Val Commerce
      </NuxtLink>
      <div class="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
        <NuxtLink v-for="item in navigation" :key="item.href" :to="item.href" class="hover:text-primary-600">
          {{ item.label }}
        </NuxtLink>
      </div>
      <div class="flex items-center gap-4">
        <NuxtLink to="/cart" class="relative inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md">
          <ShoppingCartIcon class="mr-2 h-5 w-5" />
          Cart
          <span
            v-if="totalItems"
            class="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-primary-600"
          >
            {{ totalItems }}
          </span>
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/vue/24/solid'

const { totalItems } = useCart()

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '#products' },
  { label: 'About', href: '#about' },
  { label: 'Journal', href: '#stories' }
]
</script>

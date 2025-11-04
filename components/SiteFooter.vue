<template>
  <footer id="about" class="border-t border-slate-200 bg-white">
    <div class="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div>
        <NuxtLink to="/" class="flex items-center gap-2 text-lg font-semibold text-primary-600">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <ShoppingBagIcon class="h-6 w-6" />
          </span>
          Val Commerce
        </NuxtLink>
        <p class="mt-4 text-sm leading-6 text-slate-600">
          We design considered essentials for modern explorers. Built to move effortlessly between city streets and remote escapes.
        </p>
      </div>
      <div class="grid grid-cols-2 gap-8 text-sm text-slate-500">
        <div>
          <h3 class="font-semibold uppercase tracking-wide text-slate-900">Shop</h3>
          <ul class="mt-4 space-y-3">
            <li><NuxtLink to="#products" class="hover:text-primary-600">New arrivals</NuxtLink></li>
            <li><a href="#stories" class="hover:text-primary-600">Stories</a></li>
            <li><a href="#about" class="hover:text-primary-600">Sustainability</a></li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold uppercase tracking-wide text-slate-900">Support</h3>
          <ul class="mt-4 space-y-3">
            <li><a href="mailto:hello@valcommerce.demo" class="hover:text-primary-600">Contact</a></li>
            <li><a href="#" class="hover:text-primary-600">Shipping & Returns</a></li>
            <li><a href="#" class="hover:text-primary-600">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div>
        <h3 class="text-base font-semibold text-slate-900">Join our newsletter</h3>
        <p class="mt-2 text-sm text-slate-500">
          Be first to hear about limited drops, journal entries, and exclusive events.
        </p>
        <form class="mt-4 flex gap-3">
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            class="w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <button type="submit" class="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
            Join
          </button>
        </form>
      </div>
    </div>
    <div class="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
      © {{ currentYear }} {{ config.public.companyName }}. All rights reserved.
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ShoppingBagIcon } from '@heroicons/vue/24/solid'

const config = useRuntimeConfig()
const currentYear = new Date().getFullYear()
</script>

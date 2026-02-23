<template>
  <footer id="about" class="border-t border-slate-200 bg-white">
    <div class="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div>
        <NuxtLink to="/" class="flex items-center gap-2 text-lg font-semibold text-primary-600">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <ShoppingBagIcon class="h-6 w-6" />
          </span>
          Commerce Demo
        </NuxtLink>
        <p class="mt-4 text-sm leading-6 text-slate-600">
          We design considered essentials for modern explorers. Built to move effortlessly between city streets and remote escapes.
        </p>
      </div>
      <div class="grid grid-cols-2 gap-8 text-sm text-slate-500">
        <div>
          <h3 class="font-semibold uppercase tracking-wide text-slate-900">Shop</h3>
          <ul class="mt-4 space-y-3">
            <li><NuxtLink to="/categories" class="hover:text-primary-600">Categories</NuxtLink></li>
            <li><NuxtLink to="/journal" class="hover:text-primary-600">Stories</NuxtLink></li>
            <li><NuxtLink to="/about" class="hover:text-primary-600">Sustainability</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold uppercase tracking-wide text-slate-900">Support</h3>
          <ul class="mt-4 space-y-3">
            <li><a href="mailto:hello@commerce.demo" class="hover:text-primary-600">Contact</a></li>
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
        <NewsletterSubscribeForm source="homepage-footer" variant="footer" input-id="newsletter-email-footer" />
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

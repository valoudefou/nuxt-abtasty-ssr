<template>
  <main
    class="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-900"
    style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"
  >
    <div class="mx-auto flex w-full max-w-3xl flex-col items-center">
      <section class="w-full rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14">
        <h1 class="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Which organisation are you working for?
        </h1>
        <p class="mt-4 text-lg text-slate-600">
          Choose your product catalog.
        </p>

        <div class="mx-auto mt-10 w-full max-w-2xl text-left">
          <label class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Vendor
          </label>
          <div class="mt-2 relative">
            <select
              class="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-6 py-5 pr-14 text-lg font-medium text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              :value="selectedVendorId"
              :disabled="Boolean(pendingVendorId)"
              @change="onSelectChange"
            >
              <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
                {{ vendor.name }}
              </option>
            </select>
            <span class="pointer-events-none absolute inset-y-0 right-5 flex items-center text-lg text-slate-400">
              ▾
            </span>
          </div>
          <p class="mt-4 text-base font-medium" :class="pendingVendorId ? 'text-primary-600' : 'text-slate-500'">
            {{ pendingVendorId ? 'Saving your selection...' : `Current catalog on site: ${selectedVendorId}` }}
          </p>
          <div class="mt-6 flex justify-end">
            <NuxtLink
              to="/"
              class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600"
            >
              Browse
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { DEFAULT_VENDOR_CLIENT, getSelectedVendorClient, VENDOR_STORAGE } from '@/utils/vendorsClient'

definePageMeta({
  layout: 'blank'
})

type Vendor = {
  id: string
  name: string
}

const route = useRoute()

const { data } = await useAsyncData<{ data: Vendor[] }>(
  'trial-vendors',
  () => $fetch('/api/vendors', { query: { fresh: '1' } }),
  { server: true }
)

const vendors = computed<Vendor[]>(() => {
  const list = data.value?.data ?? []
  return list.length > 0 ? list : [{ id: DEFAULT_VENDOR_CLIENT, name: 'Karkkainen' }]
})

const selectedVendorId = ref<string>(DEFAULT_VENDOR_CLIENT)
const pendingVendorId = ref<string>('')

onMounted(() => {
  selectedVendorId.value = getSelectedVendorClient()
})

const getRedirectTarget = () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect.trim() || '/'
}

const onSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement | null
  const vendorId = target?.value ? String(target.value).trim() : ''
  if (!vendorId) {
    return
  }
  void selectVendor(vendorId)
}

const selectVendor = async (vendorId: string) => {
  if (!vendorId || pendingVendorId.value) return
  pendingVendorId.value = vendorId

  try {
    const response = await $fetch<{ ok: boolean; vendor: string }>('/api/trial/select', {
      method: 'POST',
      body: { vendor: vendorId }
    })

    if (response?.ok) {
      if (import.meta.client) {
        localStorage.setItem(VENDOR_STORAGE, vendorId)
      }
      selectedVendorId.value = vendorId
      await navigateTo(getRedirectTarget())
    }
  } catch (error) {
    console.error('Failed to select vendor', error)
  } finally {
    pendingVendorId.value = ''
  }
}
</script>

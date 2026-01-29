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
          <form class="mt-3" @submit.prevent="onVendorSubmit">
            <input
              v-model.trim="vendorQuery"
              type="text"
              placeholder="Company name"
              autocomplete="off"
              class="w-full rounded-2xl border border-slate-200 bg-white px-6 py-5 text-lg font-medium text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              :disabled="Boolean(pendingVendorId)"
              @input="onVendorInput"
            />
            <div class="mt-4 flex justify-center">
              <button
                type="submit"
                class="text-base font-semibold text-primary-600 transition hover:text-primary-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="Boolean(pendingVendorId) || !vendorQuery"
              >
                Use catalog
              </button>
            </div>
          </form>
          <p
            class="mt-4 text-base font-medium"
            :class="pendingVendorId ? 'text-primary-600' : vendorError ? 'text-red-600' : 'text-slate-500'"
          >
            {{ pendingVendorId ? 'Saving your selection...' : vendorError }}
          </p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { getSelectedVendorClient, VENDOR_STORAGE } from '@/utils/vendorsClient'

definePageMeta({
  layout: 'blank'
})

type Vendor = {
  id: string
  name: string
}

const { data } = await useAsyncData<{ data: Vendor[] }>(
  'trial-vendors',
  () => $fetch<{ data: Vendor[] }>('/api/vendors', { params: { fresh: 1 } }),
  { server: true }
)

const vendors = computed<Vendor[]>(() => {
  return data.value?.data ?? []
})

const selectedVendorId = ref<string>('')
const pendingVendorId = ref<string>('')
const vendorQuery = ref<string>('')
const vendorError = ref<string>('')

const vendorNameById = computed<Record<string, string>>(() => {
  return vendors.value.reduce<Record<string, string>>((acc, vendor) => {
    acc[vendor.id] = vendor.name
    return acc
  }, {})
})

const selectedVendorName = computed(() => {
  return vendorNameById.value[selectedVendorId.value] || selectedVendorId.value
})

onMounted(() => {
  const currentVendorId = getSelectedVendorClient()
  selectedVendorId.value = currentVendorId
  if (currentVendorId) {
    vendorQuery.value = vendorNameById.value[currentVendorId] || currentVendorId
  }
})

const normalize = (value: string) => value.trim().toLowerCase()

const findVendorMatch = (query: string) => {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return null

  return (
    vendors.value.find((vendor) => {
      return normalize(vendor.id) === normalizedQuery || normalize(vendor.name) === normalizedQuery
    }) || null
  )
}

const onVendorInput = () => {
  if (vendorError.value) {
    vendorError.value = ''
  }
}

const onVendorSubmit = () => {
  if (!vendorQuery.value || pendingVendorId.value) return

  const match = findVendorMatch(vendorQuery.value)
  if (!match) {
    vendorError.value = 'No catalog found'
    return
  }

  vendorError.value = ''
  vendorQuery.value = match.name
  void selectVendor(match.id)
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
      await navigateTo(`/v/${encodeURIComponent(vendorId)}/categories`)
    }
  } catch (error) {
    console.error('Failed to select vendor', error)
  } finally {
    pendingVendorId.value = ''
  }
}
</script>

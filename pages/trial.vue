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

const vendorsLoaded = computed(() => (data.value?.data?.length ?? 0) > 0)

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

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const normalizeLoose = (value: string) =>
  normalize(value)
    .replace(/%[0-9a-f]{2}/gi, (encoded) => safeDecode(encoded))
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const scoreVendorMatch = (vendor: Vendor, query: string) => {
  const q = normalizeLoose(query)
  const id = normalizeLoose(vendor.id)
  const name = normalizeLoose(vendor.name)

  if (!q) return 0

  if (id === q || name === q) return 100
  if (name.startsWith(q) || id.startsWith(q)) return 80
  if (name.includes(q) || id.includes(q)) return 60
  // Handle pasted URLs / longer strings like "vendors/Hawes%20%26%20Curtis/products".
  if ((name.length >= 4 && q.includes(name)) || (id.length >= 4 && q.includes(id))) return 55

  const stopwords = new Set([
    'and',
    'or',
    'the',
    'a',
    'an',
    'of',
    'for',
    'to',
    'in',
    'on',
    'with',
    'vendor',
    'vendors',
    'catalog',
    'catalogs',
    'product',
    'products'
  ])
  const tokenize = (value: string) =>
    value
      .split(' ')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter((entry) => !stopwords.has(entry))

  const queryTokens = new Set(tokenize(q))
  const vendorTokens = tokenize(name).length ? tokenize(name) : tokenize(id)
  if (vendorTokens.length === 0 || queryTokens.size === 0) return 0

  let overlap = 0
  for (const token of vendorTokens) {
    if (queryTokens.has(token)) overlap += 1
  }

  if (overlap === vendorTokens.length && overlap >= 2) return 50
  if (vendorTokens.length >= 2 && overlap / vendorTokens.length >= 0.66) return 45

  return 0
}

const findVendorMatches = (query: string) => {
  const queries = [query, safeDecode(query)]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const matches = vendors.value
    .map((vendor) => {
      const score = Math.max(...queries.map((q) => scoreVendorMatch(vendor, q)))
      return { vendor, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.vendor.name.localeCompare(b.vendor.name))

  return matches
}

const onVendorInput = () => {
  if (vendorError.value) {
    vendorError.value = ''
  }
}

const onVendorSubmit = () => {
  if (!vendorQuery.value || pendingVendorId.value) return

  const matches = findVendorMatches(vendorQuery.value)
  if (matches.length === 0) {
    vendorError.value = ''
    void selectVendor(safeDecode(vendorQuery.value))
    return
  }

  const first = matches[0]
  const second = matches[1]
  if (second && first.score === second.score) {
    vendorError.value = `Multiple catalogs found: ${matches
      .slice(0, 3)
      .map((entry) => entry.vendor.name)
      .join(', ')}`
    return
  }

  const match = first.vendor
  vendorError.value = ''
  vendorQuery.value = match.name
  void selectVendor(match.id)
}

const selectVendor = async (vendorId: string) => {
  if (!vendorId || pendingVendorId.value) return
  pendingVendorId.value = vendorId
  vendorError.value = ''

  try {
    const response = await $fetch<{ ok: boolean; vendor: string }>('/api/trial/select', {
      method: 'POST',
      body: { vendor: vendorId }
    })

    if (response?.ok) {
      const selectedId = response.vendor || vendorId
      if (import.meta.client) {
        localStorage.setItem(VENDOR_STORAGE, selectedId)
      }
      selectedVendorId.value = selectedId
      vendorQuery.value = vendorNameById.value[selectedId] || selectedId
      await navigateTo(`/v/${encodeURIComponent(selectedId)}/categories`)
    }
  } catch (error) {
    console.error('Failed to select vendor', error)
    const errorCode = (error as { data?: { error?: string } })?.data?.error
    vendorError.value = errorCode === 'invalid_vendor' ? 'No catalog found' : 'Unable to save selection'
  } finally {
    pendingVendorId.value = ''
  }
}
</script>

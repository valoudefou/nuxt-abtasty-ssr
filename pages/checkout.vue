<template>
  <div class="space-y-10">
    <header>
      <h1 class="text-3xl font-semibold text-slate-900">Checkout</h1>
      <p class="mt-2 text-sm text-slate-600">Provide your shipping details and confirm your payment method.</p>
    </header>

    <div class="grid gap-10 lg:grid-cols-[3fr,2fr]">
      <section class="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h2 class="text-xl font-semibold text-slate-900">Shipping information</h2>
          <form class="mt-6 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="text-sm font-medium text-slate-700">
                First name
                <input
                  v-model="firstName"
                  type="text"
                  class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <label class="text-sm font-medium text-slate-700">
                Last name
                <input
                  v-model="lastName"
                  type="text"
                  class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </label>
            </div>
            <label class="text-sm font-medium text-slate-700">
              Address
              <div class="relative mt-1">
                <input
                  v-model="addressInput"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  placeholder="Start typing your address"
                />
                <div
                  v-if="addressLoading"
                  class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400"
                >
                  Loading…
                </div>
                <ul
                  v-if="addressSuggestions.length > 0"
                  class="absolute z-10 mt-2 max-h-48 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-2 text-sm shadow-lg"
                >
                  <li
                    v-for="suggestion in addressSuggestions"
                    :key="suggestion.id"
                    class="cursor-pointer px-4 py-2 text-slate-700 hover:bg-slate-50"
                    @click="selectAddressSuggestion(suggestion)"
                  >
                    {{ suggestion.address }}
                  </li>
                </ul>
              </div>
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="text-sm font-medium text-slate-700">
                City
                <input
                  v-model="cityInput"
                  type="text"
                  class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <label class="text-sm font-medium text-slate-700">
                ZIP / Postal code
                <input
                  v-model="postcodeInput"
                  type="text"
                  class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </label>
            </div>
            <label class="text-sm font-medium text-slate-700">
              Country
              <select
                v-model="countryInput"
                disabled
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-100"
              >
                <option>United Kingdom</option>
              </select>
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-600">
              <input
                v-model="useShippingForBilling"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked
              />
              Use same address for billing
            </label>
            <Transition name="fade">
              <div v-if="!useShippingForBilling" class="space-y-4 rounded-2xl border border-slate-100 p-4">
                <p class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Billing address</p>
                <label class="text-sm font-medium text-slate-700">
                  Address
                  <input
                    v-model="billingAddress"
                    type="text"
                    class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </label>
                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="text-sm font-medium text-slate-700">
                    City
                    <input
                      v-model="billingCity"
                      type="text"
                      class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </label>
                  <label class="text-sm font-medium text-slate-700">
                    ZIP / Postal code
                    <input
                      v-model="billingPostcode"
                      type="text"
                      class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </label>
                </div>
                <label class="text-sm font-medium text-slate-700">
                  Country
                  <select
                    v-model="billingCountry"
                    class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  >
                    <option>United Kingdom</option>
                    <option>United States</option>
                    <option>Canada</option>
                    <option>Australia</option>
                  </select>
                </label>
              </div>
            </Transition>
          </form>
        </div>

        <div>
          <h2 class="text-xl font-semibold text-slate-900">Delivery options</h2>
          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <label
              v-for="option in deliveryOptions"
              :key="option.id"
              class="flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm text-slate-700 transition"
              :class="selectedDeliveryId === option.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-500'"
            >
              <div>
                <p class="font-semibold text-slate-900">{{ option.label }}</p>
                <p class="text-xs text-slate-500">{{ option.description }}</p>
              </div>
              <p class="font-semibold text-slate-900">£{{ option.cost.toFixed(2) }}</p>
              <input
                type="radio"
                class="sr-only"
                name="delivery"
                :value="option.id"
                :checked="selectedDeliveryId === option.id"
                @change="selectedDeliveryId = option.id"
              />
            </label>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Payment method</h2>
            <div class="flex items-center gap-2 text-slate-500">
              <span class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest">
                <span class="h-3 w-5 rounded bg-gradient-to-r from-[#1a1f71] to-[#3b4cca]"></span>
                Visa
              </span>
              <span class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest">
                <span class="h-3 w-5 rounded bg-gradient-to-r from-[#ff5f00] via-[#ff5f00] to-[#eb001b]"></span>
                Mastercard
              </span>
            </div>
          </div>
          <form class="mt-6 space-y-4">
            <label class="text-sm font-medium text-slate-700">
              Card number
              <input
                v-model="cardNumber"
                type="text"
                class="mt-1 w-full rounded-2xl border border-slate-100 bg-slate-100 px-4 py-2 text-sm text-slate-500 outline-none"
                disabled
              />
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="text-sm font-medium text-slate-700">
                Expiry date
                <input
                  v-model="cardExpiry"
                  type="text"
                  class="mt-1 w-full rounded-2xl border border-slate-100 bg-slate-100 px-4 py-2 text-sm text-slate-500 outline-none"
                  disabled
                />
              </label>
              <label class="text-sm font-medium text-slate-700">
                CVC
                <input
                  v-model="cardCvc"
                  type="text"
                  class="mt-1 w-full rounded-2xl border border-slate-100 bg-slate-100 px-4 py-2 text-sm text-slate-500 outline-none"
                  disabled
                />
              </label>
            </div>
            <label class="text-sm font-medium text-slate-700">
              Name on card
              <input
                v-model="cardName"
                type="text"
                class="mt-1 w-full rounded-2xl border border-slate-100 bg-slate-100 px-4 py-2 text-sm text-slate-500 outline-none"
                disabled
              />
            </label>
          </form>
        </div>
      </section>

      <aside class="space-y-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900">Your items</h3>
          <ul class="mt-4 space-y-4 text-sm text-slate-700">
            <li v-for="item in items" :key="item.id" class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <img :src="item.image" :alt="item.name" class="h-12 w-12 rounded-2xl object-cover" />
                <div>
                  <p class="font-semibold text-slate-900">{{ item.name }}</p>
                  <p class="text-xs text-slate-500">{{ item.quantity }} × {{ formatCurrency(item.price) }}</p>
                </div>
              </div>
              <p class="font-semibold text-slate-900">{{ formatCurrency(item.price * item.quantity) }}</p>
            </li>
          </ul>
          <div v-if="!items.length" class="text-sm text-slate-500">No products in your cart.</div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900">Order summary</h3>
          <dl class="mt-4 space-y-2 text-sm text-slate-600">
            <div class="flex items-center justify-between">
              <dt>Items</dt>
              <dd>{{ formatCurrency(subtotal) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Delivery</dt>
              <dd>{{ formatCurrency(deliveryCost) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Tax</dt>
              <dd>—</dd>
            </div>
          </dl>
          <div class="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
            <span>Total due now</span>
            <span>{{ formatCurrency(grandTotal) }}</span>
          </div>
          <button
            class="mt-6 w-full rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            :disabled="!canConfirm || creatingOrder"
            @click="confirmAndPay"
          >
            {{ creatingOrder ? 'Placing order…' : 'Confirm and pay' }}
          </button>
          <p v-if="createOrderErrorMessage" class="mt-3 text-sm text-red-600">
            {{ createOrderErrorMessage }}
          </p>
        </div>
        <p class="text-xs text-slate-500">All transactions are secured with industry-standard encryption.</p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CreateOrderRequest } from '@/types/order'
import { useCreateOrder } from '@/composables/useCreateOrder'

const { items, subtotal, clear } = useCart()
const config = useRuntimeConfig()
const router = useRouter()
const route = useRoute()
const { create: createOrder, creating: creatingOrder, error: createOrderError } = useCreateOrder()
const createOrderErrorMessage = computed(() => createOrderError.value)
const checkoutSummary = useState<
  {
    orderId: string
    remoteOrderId?: number
    publicOrderId?: string
    items: Array<{
      id: string | number
      name: string
      quantity: number
      price: number
      image: string
      category: string
    }>
    total: number
    email: string
    shipping: {
      firstName: string
      lastName: string
      address: string
      city: string
      postcode: string
      country: string
    }
    billing: {
      address: string
      city: string
      postcode: string
      country: string
    }
    delivery: {
      id: string
      label: string
      cost: number
      description: string
    }
  } | null
>('checkout-summary', () => null)

const firstName = ref('')
const lastName = ref('')
const addressInput = ref('')
const addressSuggestions = ref<Array<{ id: string; address: string }>>([])
const addressLoading = ref(false)
const cityInput = ref('')
const postcodeInput = ref('')
const countryInput = ref('United Kingdom')
const useShippingForBilling = ref(true)
const billingAddress = ref('')
const billingCity = ref('')
const billingPostcode = ref('')
const billingCountry = ref('United Kingdom')
const cardNumber = ref('4242 4242 4242 4242')
const cardExpiry = ref('12/34')
const cardCvc = ref('123')
const cardName = ref('John Smith')
const suppressAutocomplete = ref(false)
let addressDebounce: ReturnType<typeof setTimeout> | null = null

const normalizeEmailPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const derivedEmail = computed(() => {
  const first = normalizeEmailPart(firstName.value)
  const last = normalizeEmailPart(lastName.value)
  if (!first || !last) return ''
  return `${first}.${last}@commerce-demo.com`
})

const deliveryOptions = [
  { id: 'evri', label: 'Evri (Standard)', description: 'Arrives within 3-5 days', cost: 2.99 },
  { id: 'royal-mail', label: 'Royal Mail (Tracked)', description: 'Arrives within 2-3 days', cost: 5.99 },
  { id: 'dpd', label: 'DPD (Next-day)', description: 'Next working day delivery', cost: 8.99 },
  { id: 'parcel-force', label: 'Parcel Force (Express)', description: 'Priority express service', cost: 12.99 }
] as const

const selectedDeliveryId = ref<(typeof deliveryOptions)[number]['id']>(deliveryOptions[0].id)
const deliveryCost = computed(() => deliveryOptions.find((option) => option.id === selectedDeliveryId.value)?.cost ?? 0)
const grandTotal = computed(() => subtotal.value + deliveryCost.value)

const fetchAddressSuggestions = async (query: string) => {
  if (!import.meta.client) return
  const enabled = Boolean(config.public.getAddress?.enabled)
  if (!enabled || query.trim().length < 3) {
    addressSuggestions.value = []
    return
  }

  addressLoading.value = true
  try {
    const data = await $fetch<{ suggestions?: Array<{ id: string; address: string }> }>(
      '/api/getaddress/autocomplete',
      {
        params: { q: query },
        // Avoid sending large third-party cookies (AB Tasty / Klaviyo, etc.) to Vercel functions.
        credentials: 'omit'
      }
    )
    addressSuggestions.value = data?.suggestions ?? []
  } catch (error) {
    console.error('Failed to fetch address suggestions', error)
    addressSuggestions.value = []
  } finally {
    addressLoading.value = false
  }
}

const parsePostcode = (value?: string | string[]) => {
  const source = Array.isArray(value) ? value.join(', ') : value ?? ''
  const match = source.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i)
  return match ? match[0].toUpperCase().replace(/\s+/, ' ') : ''
}

const fetchAddressDetails = async (id: string, displayAddress: string) => {
  const enabled = Boolean(config.public.getAddress?.enabled)
  if (!enabled) return
  try {
    const detail = await $fetch<{
      addresses?: Array<{
        formatted_address?: string[]
        line_1?: string
        line_2?: string
        line_3?: string
        town_or_city?: string
        county?: string
        postcode?: string
      }>
      postcode?: string
    }>(`/api/getaddress/get/${encodeURIComponent(id)}`, {
      // Avoid sending large third-party cookies (AB Tasty / Klaviyo, etc.) to Vercel functions.
      credentials: 'omit'
    })

    const first = detail?.addresses?.[0]
    const derivedCity = displayAddress.split(',').slice(1)[0]?.trim() || cityInput.value
    const derivedPostcode = first?.postcode || detail?.postcode || parsePostcode(first?.formatted_address)

    cityInput.value = derivedCity ?? ''
    if (derivedPostcode) {
      postcodeInput.value = derivedPostcode
    }
  } catch (error) {
    console.error('Failed to fetch address details', error)
  }
}

const requiredFields = computed(() => [
  firstName.value,
  lastName.value,
  addressInput.value,
  cityInput.value,
  postcodeInput.value,
  derivedEmail.value,
  cardNumber.value,
  cardExpiry.value,
  cardCvc.value,
  cardName.value,
  ...(useShippingForBilling.value
    ? []
    : [billingAddress.value, billingCity.value, billingPostcode.value, billingCountry.value])
])

const canConfirm = computed(
  () => items.value.length > 0 && requiredFields.value.every((value) => value.trim().length > 0)
)

const selectAddressSuggestion = (suggestion: { id: string; address: string }) => {
  suppressAutocomplete.value = true
  const [street] = suggestion.address.split(',')
  addressInput.value = street.trim()
  addressSuggestions.value = []
  void fetchAddressDetails(suggestion.id, suggestion.address)
}

const confirmAndPay = () => {
  if (!canConfirm.value) {
    return
  }
  const orderId = `VC-${Date.now().toString(36).toUpperCase()}`
  const selectedDelivery = deliveryOptions.find((option) => option.id === selectedDeliveryId.value)

  const customerAddress = [addressInput.value, cityInput.value, postcodeInput.value, countryInput.value]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')

  const payload: CreateOrderRequest = {
    idempotencyKey: (import.meta.client && globalThis.crypto?.randomUUID) ? globalThis.crypto.randomUUID() : orderId,
    customer: {
      name: `${firstName.value} ${lastName.value}`.trim(),
      email: derivedEmail.value,
      address: customerAddress
    },
    items: items.value.map((item) => ({
      product: {
        sku: item.sku?.trim() || String(item.id),
        name: item.name,
        price: item.price
      },
      quantity: item.quantity
    }))
  }

  checkoutSummary.value = {
    orderId,
    items: items.value.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      category: item.category
    })),
    total: grandTotal.value,
    email: derivedEmail.value,
    shipping: {
      firstName: firstName.value,
      lastName: lastName.value,
      address: addressInput.value,
      city: cityInput.value,
      postcode: postcodeInput.value,
      country: countryInput.value
    },
    delivery: {
      id: selectedDeliveryId.value,
      label: selectedDelivery?.label ?? '',
      cost: deliveryCost.value,
      description: selectedDelivery?.description ?? ''
    },
    billing: {
      address: useShippingForBilling.value ? addressInput.value : billingAddress.value,
      city: useShippingForBilling.value ? cityInput.value : billingCity.value,
      postcode: useShippingForBilling.value ? postcodeInput.value : billingPostcode.value,
      country: useShippingForBilling.value ? countryInput.value : billingCountry.value
    }
  }

  void (async () => {
    try {
      const created = await createOrder(payload)
      if (checkoutSummary.value) {
        if (typeof (created as { id?: unknown }).id === 'number') {
          checkoutSummary.value.remoteOrderId = (created as { id: number }).id
        }
        if (typeof (created as { publicId?: unknown }).publicId === 'string') {
          checkoutSummary.value.publicOrderId = (created as { publicId: string }).publicId
        }
      }
      if (import.meta.client && checkoutSummary.value) {
        sessionStorage.setItem('checkout-summary', JSON.stringify(checkoutSummary.value))
      }

      const confirmationUrl =
        (created && typeof created === 'object' && typeof (created as { confirmationUrl?: unknown }).confirmationUrl === 'string')
          ? String((created as { confirmationUrl: string }).confirmationUrl)
          : (() => {
            const publicId = typeof (created as { publicId?: unknown }).publicId === 'string'
              ? String((created as { publicId: string }).publicId)
              : ''
            if (!publicId) return '/order-confirmation'
            const encodedPublicId = encodeURIComponent(publicId)
            const companyIdParam = route.params.companyId
            const companyId = Array.isArray(companyIdParam) ? String(companyIdParam[0] ?? '') : String(companyIdParam ?? '')
            if (route.path.startsWith('/v/companyId/') && companyId) {
              return `/v/companyId/${encodeURIComponent(companyId)}/order-confirmation/${encodedPublicId}`
            }
            if (route.path.startsWith('/v/') && companyId) {
              return `/v/${encodeURIComponent(companyId)}/order-confirmation/${encodedPublicId}`
            }
            return `/order-confirmation/${encodedPublicId}`
          })()

      clear()
      if (import.meta.client) {
        window.location.href = confirmationUrl
        return
      }
      await router.push(confirmationUrl)
    } catch (error) {
      console.error('Failed to create order', error)
    }
  })()
}

if (import.meta.client) {
  watch(
    () => addressInput.value,
    (value) => {
      if (addressDebounce) {
        clearTimeout(addressDebounce)
        addressDebounce = null
      }
      if (suppressAutocomplete.value) {
        suppressAutocomplete.value = false
        return
      }
      if (!value || value.trim().length < 3) {
        addressSuggestions.value = []
        return
      }
      addressDebounce = setTimeout(() => {
        void fetchAddressSuggestions(value.trim())
      }, 300)
    }
  )
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

useHead({ title: 'Checkout – Commerce Demo' })
</script>

import { computed } from 'vue'

type RecommendationField =
  | 'brand'
  | 'homepage'
  | 'category'
  | 'category_level2'
  | 'category_level3'
  | 'category_level4'
  | 'cart_products'
  | 'viewed_items'

export type RecommendationParams = {
  filterField: RecommendationField
  filterValue?: string | number[] | number | null
  categoriesInCart?: string[]
  addedToCartProductId?: number | null
  viewingItemId?: string | number | null
  cartProductIds?: number[]
  placementId?: string
  locale?: string
  currency?: string
}

type RecommendationPayload = {
  title: string
  items: {
    id: string
    product: {
      id: number
      slug: string
      name: string
      description: string
      price: number
      category: string
      image: string
      rating: number
      highlights: string[]
      inStock: boolean
      colors: string[]
      sizes: string[]
      brand?: string
      vendor?: string
      link?: string
    }
    detailUrl?: string
    externalUrl?: string
  }[]
}

type RecommendationState = {
  data: RecommendationPayload | null
  pending: boolean
  error: string | null
  updatedAt: number
  requestId: number
}

type RefreshOptions = {
  reason?: string
  background?: boolean
  debounceMs?: number
  ssr?: boolean
  force?: boolean
}

const IN_FLIGHT = new Map<string, Promise<RecommendationPayload>>()
const ABORT_CONTROLLERS = new Map<string, AbortController>()
const DEBOUNCE_TIMERS = new Map<string, ReturnType<typeof setTimeout>>()

const CACHE_TTL_MS = 1000 * 60
const STALE_TTL_MS = 1000 * 60 * 5

const normalizeArray = (value?: number[] | string[]) => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => String(entry))
    .filter((entry) => entry.trim().length > 0)
    .sort()
}

const stableKey = (params: RecommendationParams) => {
  const normalized = {
    filterField: params.filterField,
    filterValue: Array.isArray(params.filterValue)
      ? normalizeArray(params.filterValue)
      : params.filterValue ?? null,
    categoriesInCart: normalizeArray(params.categoriesInCart),
    addedToCartProductId: params.addedToCartProductId ?? null,
    viewingItemId: params.viewingItemId ?? null,
    cartProductIds: normalizeArray(params.cartProductIds),
    placementId: params.placementId ?? null,
    locale: params.locale ?? null,
    currency: params.currency ?? null
  }

  return JSON.stringify(normalized)
}

const markPerformance = (name: string) => {
  if (!import.meta.client || typeof performance === 'undefined') {
    return
  }
  performance.mark(name)
}

const measurePerformance = (name: string, startMark: string, endMark: string) => {
  if (!import.meta.client || typeof performance === 'undefined') {
    return
  }
  performance.mark(endMark)
  performance.measure(name, startMark, endMark)
}

const isAbortError = (err: unknown) => {
  if (!err) return false
  if (err instanceof DOMException && err.name === 'AbortError') {
    return true
  }
  if (typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
    return true
  }
  return String(err).toLowerCase().includes('aborted')
}

const getClientId = () => {
  const idState = useState<string>('recommendations-client-id', () => '')
  if (idState.value) {
    return idState.value
  }
  if (import.meta.client && typeof crypto !== 'undefined') {
    idState.value = crypto.randomUUID()
  } else {
    idState.value = `srv-${Math.random().toString(36).slice(2, 10)}`
  }
  return idState.value
}

const getStateBucket = () =>
  useState<Record<string, RecommendationState>>('recommendations-state', () => ({}))

const ensureState = (key: string) => {
  const bucket = getStateBucket()
  if (!bucket.value[key]) {
    bucket.value[key] = {
      data: null,
      pending: false,
      error: null,
      updatedAt: 0,
      requestId: 0
    }
  }
  return bucket.value[key]
}

const shouldRefresh = (state: RecommendationState, force?: boolean) => {
  if (force) return true
  if (!state.data) return true
  const age = Date.now() - state.updatedAt
  return age > CACHE_TTL_MS
}

const shouldServeStale = (state: RecommendationState) => {
  if (!state.data) return false
  const age = Date.now() - state.updatedAt
  return age <= STALE_TTL_MS
}

const fetchRecommendations = async (
  key: string,
  params: RecommendationParams,
  options: RefreshOptions = {}
) => {
  const requestKey = `reco:${key}`

  if (IN_FLIGHT.has(requestKey)) {
    return await IN_FLIGHT.get(requestKey)!
  }

  const controller = new AbortController()
  const existing = ABORT_CONTROLLERS.get(requestKey)
  if (existing) {
    existing.abort()
  }
  ABORT_CONTROLLERS.set(requestKey, controller)

  const payload = {
    ...params,
    clientId: getClientId()
  }

  const startMark = `reco:${key}:start:${Date.now()}`
  markPerformance(startMark)

  const promise = $fetch<RecommendationPayload>('/api/reco', {
    method: 'POST',
    body: payload,
    signal: controller.signal,
    onResponse: () => {
      measurePerformance(`reco:${key}:ttfb`, startMark, `${startMark}:end`)
    }
  })

  IN_FLIGHT.set(requestKey, promise)

  try {
    return await promise
  } finally {
    IN_FLIGHT.delete(requestKey)
  }
}

export const useRecommendations = () => {
  const bucket = getStateBucket()

  const getRecommendations = async (
    params: RecommendationParams,
    options: RefreshOptions = {}
  ) => {
    const key = stableKey(params)
    const state = ensureState(key)

    if (!shouldRefresh(state, options.force)) {
      return state
    }

    if (options.background && shouldServeStale(state)) {
      void refreshRecommendations(params, { ...options, background: false })
      return state
    }

  return await refreshRecommendations(params, options)
}

  const refreshRecommendations = async (
    params: RecommendationParams,
    options: RefreshOptions = {}
  ) => {
    const key = stableKey(params)
    const state = ensureState(key)
    const debounceMs = options.debounceMs ?? 150
    const reason = options.reason ?? 'refresh'

    if (debounceMs > 0) {
      const pending = DEBOUNCE_TIMERS.get(key)
      if (pending) {
        clearTimeout(pending)
      }
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          DEBOUNCE_TIMERS.delete(key)
          resolve()
        }, debounceMs)
        DEBOUNCE_TIMERS.set(key, timeout)
      })
    }

    state.pending = !options.background
    state.error = null
    state.requestId += 1
    const currentRequest = state.requestId
    const startMark = `reco:${key}:${reason}:start:${Date.now()}`
    markPerformance(startMark)

    try {
      const data = await fetchRecommendations(key, params, options)
      if (currentRequest !== state.requestId) {
        return state
      }
      state.data = data
      state.updatedAt = Date.now()
      state.pending = false
      measurePerformance(`reco:${key}:${reason}:latency`, startMark, `${startMark}:end`)
      return state
    } catch (err) {
      if (currentRequest !== state.requestId) {
        return state
      }
      if (isAbortError(err)) {
        state.pending = false
        return state
      }
      state.error = err instanceof Error ? err.message : String(err)
      state.pending = false
      return state
    }
  }

  const stateFor = (params: RecommendationParams) => {
    const key = stableKey(params)
    const state = ensureState(key)
    return computed(() => bucket.value[key] ?? state)
  }

  return {
    getRecommendations,
    refreshRecommendations,
    stateFor,
    buildKey: stableKey
  }
}

import { computed, watch } from 'vue'

type ViewedProductsState = {
  items: string[]
}

export const useViewedProducts = () => {
  const STORAGE_KEY = 'val-commerce-viewed-products'
  const state = useState<ViewedProductsState>('viewed-products', () => ({ items: [] }))
  const hydrated = useState<boolean>('viewed-products-hydrated', () => false)

  if (import.meta.client && !hydrated.value) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          state.value.items = parsed
            .map((value) => String(value).trim())
            .filter((value) => value.length > 0)
        }
      }
    } catch (error) {
      console.warn('Failed to hydrate viewed products from storage', error)
    } finally {
      hydrated.value = true
    }
  }

  if (import.meta.client) {
    watch(
      () => state.value.items,
      (items) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        } catch (error) {
          console.warn('Failed to persist viewed products', error)
        }
      },
      { deep: true }
    )
  }

  const addViewedProduct = (id: string | number) => {
    const normalized = String(id).trim()
    if (!normalized) return

    const next = state.value.items.filter((item) => item !== normalized)
    next.push(normalized)

    const MAX_ITEMS = 20
    state.value.items = next.slice(-MAX_ITEMS)
  }

  const clearViewedProducts = () => {
    state.value.items = []
  }

  return {
    viewedProducts: computed(() => state.value.items),
    addViewedProduct,
    clearViewedProducts
  }
}

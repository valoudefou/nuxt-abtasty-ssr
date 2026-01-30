import type { Product } from '@/types/product'

type CartItem = Product & { quantity: number; selectedSize?: string }

type CartState = {
  items: CartItem[]
}

export const useCart = () => {
  const STORAGE_KEY = 'val-commerce-cart'
  const state = useState<CartState>('cart', () => ({ items: [] }))
  const notifications = useNotifications()
  const hydratedFromStorage = useState<boolean>('cart-storage-hydrated', () => false)

  if (import.meta.client && !hydratedFromStorage.value) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          state.value.items = parsed
        }
      }
    } catch (error) {
      console.warn('Failed to hydrate cart from storage', error)
    } finally {
      hydratedFromStorage.value = true
    }
  }

  if (import.meta.client) {
    watch(
      () => state.value.items,
      (items) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        } catch (error) {
          console.warn('Failed to persist cart to storage', error)
        }
      },
      { deep: true }
    )
  }

  const logCartIds = () => {
    if (!import.meta.client) return
    const ids = state.value.items.map((item) => item.id)
    console.log('[Cart] product IDs', ids)
  }

  const logCartItems = (action: string, product: Product) => {
    if (!import.meta.client) return
    console.log('[Cart]', action, {
      id: product.id,
      name: product.name,
      quantity: state.value.items.find((item) => item.id === product.id)?.quantity ?? 0
    })
    const summary = state.value.items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity }))
    console.log('[Cart] current items', summary)
  }

  const totalItems = computed(() => state.value.items.reduce((count, item) => count + item.quantity, 0))

  const subtotal = computed(() =>
    state.value.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  )

  const matchesVariant = (item: CartItem, productId: string | number, selectedSize?: string) =>
    item.id === productId && (item.selectedSize ?? null) === (selectedSize ?? null)

  const pendingNotificationTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  const addItem = (product: Product, quantity = 1, selectedSize?: string) => {
    const existingItem = state.value.items.find((item) =>
      matchesVariant(item, product.id, selectedSize)
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      state.value.items.push({ ...product, quantity, selectedSize: selectedSize ?? undefined })
    }
    logCartIds()

    if (pendingNotificationTimeout.value) {
      clearTimeout(pendingNotificationTimeout.value)
      pendingNotificationTimeout.value = null
    }

    pendingNotificationTimeout.value = setTimeout(() => {
      notifications.show({
        title: 'Added to cart',
        message: `${product.name}${selectedSize ? ` (${selectedSize})` : ''} has been added to your cart.`,
        type: 'cart'
      })
      pendingNotificationTimeout.value = null
    }, 100)

    logCartItems('added', product)
  }

  const removeItem = (productId: string | number, selectedSize?: string) => {
    if (selectedSize === undefined) {
      state.value.items = state.value.items.filter((item) => item.id !== productId)
    } else {
      state.value.items = state.value.items.filter((item) => !matchesVariant(item, productId, selectedSize))
    }
    logCartIds()
  }

  const updateQuantity = (productId: string | number, quantity: number, selectedSize?: string) => {
    const item = state.value.items.find((product) => matchesVariant(product, productId, selectedSize))
    if (!item) return
    if (quantity <= 0) {
      removeItem(productId, selectedSize)
      return
    }
    item.quantity = quantity
    logCartIds()
  }

  const clear = () => {
    state.value.items = []
    logCartIds()
  }

  return {
    state,
    items: computed(() => state.value.items),
    totalItems,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clear
  }
}

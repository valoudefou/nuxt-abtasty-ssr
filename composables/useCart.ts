import type { Product } from '@/types/product'

type CartItem = Product & { quantity: number }

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

  const pendingNotificationTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  const addItem = (product: Product, quantity = 1) => {
    const existingItem = state.value.items.find((item) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      state.value.items.push({ ...product, quantity })
    }
    logCartIds()

    if (pendingNotificationTimeout.value) {
      clearTimeout(pendingNotificationTimeout.value)
      pendingNotificationTimeout.value = null
    }

    pendingNotificationTimeout.value = setTimeout(() => {
      notifications.show({
        title: 'Added to cart',
        message: `${product.name} has been added to your cart.`,
        type: 'cart'
      })
      pendingNotificationTimeout.value = null
    }, 100)

    logCartItems('added', product)
  }

  const removeItem = (productId: number) => {
    state.value.items = state.value.items.filter((item) => item.id !== productId)
    logCartIds()
  }

  const updateQuantity = (productId: number, quantity: number) => {
    const item = state.value.items.find((product) => product.id === productId)
    if (!item) return
    if (quantity <= 0) {
      removeItem(productId)
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

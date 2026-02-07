import { toValue, type MaybeRefOrGetter, type Ref } from 'vue'

const toNonEmptyString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export function useCheckoutAbandonment(
  checkoutId: string,
  checkoutToken: string,
  isCompletedRef?: Ref<boolean>
): { sendAbandon: () => void }
export function useCheckoutAbandonment(
  checkoutId: MaybeRefOrGetter<string>,
  checkoutToken: MaybeRefOrGetter<string>,
  isCompletedRef?: Ref<boolean>
): { sendAbandon: () => void }
export function useCheckoutAbandonment(
  checkoutId: MaybeRefOrGetter<string>,
  checkoutToken: MaybeRefOrGetter<string>,
  isCompletedRef?: Ref<boolean>
) {
  const noop = () => {}
  if (!import.meta.client) return { sendAbandon: noop }

  const sendAbandon = () => {
    const id = toNonEmptyString(toValue(checkoutId))
    const token = toNonEmptyString(toValue(checkoutToken))
    if (!id || !token) return
    if (isCompletedRef?.value) return

    // Use same-origin endpoint so it can be proxied server-side to the Java service (avoids CORS/unload issues).
    const url = new URL(`/checkouts/${encodeURIComponent(id)}/abandon`, window.location.origin)
    url.searchParams.set('token', token)

    const ok = navigator.sendBeacon && navigator.sendBeacon(url.toString())
    if (!ok) {
      fetch(url.toString(), { method: 'POST', keepalive: true }).catch(() => {})
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') sendAbandon()
  }

  onMounted(() => {
    window.addEventListener('pagehide', sendAbandon)
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pagehide', sendAbandon)
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return { sendAbandon }
}

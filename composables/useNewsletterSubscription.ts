import { getSelectedVendorClient } from '@/utils/vendorsClient'

export type NewsletterSubscribeResult = {
  ok: boolean
  alreadySubscribed: boolean
  message: string
  statusCode: number | null
}

const EMAIL_PATTERN =
  // Reasonable, user-friendly email validation (not fully RFC 5322).
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

export const isValidNewsletterEmail = (value: string) => EMAIL_PATTERN.test(value.trim())

export const subscribeNewsletter = async (
  email: string,
  source = 'homepage-footer'
): Promise<NewsletterSubscribeResult> => {
  const normalizedEmail = email.trim()
  const selectedVendor = getSelectedVendorClient()

  if (!isValidNewsletterEmail(normalizedEmail)) {
    return {
      ok: false,
      alreadySubscribed: false,
      message: 'Please enter a valid email address.',
      statusCode: 400
    }
  }

  try {
    const response = await fetch('https://order.live-server1.com/orders/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        source,
        ...(selectedVendor ? { vendor: selectedVendor } : {})
      })
    })

    const statusCode = response.status
    let json: unknown = null
    try {
      json = await response.json()
    } catch {
      json = null
    }

    if (statusCode === 201) {
      return {
        ok: true,
        alreadySubscribed: false,
        message: 'Subscribed. Please check your email.',
        statusCode
      }
    }

    if (statusCode === 200) {
      const alreadySubscribed =
        Boolean(
          json
          && typeof json === 'object'
          && 'alreadySubscribed' in json
          && (json as { alreadySubscribed?: unknown }).alreadySubscribed === true
        )

      if (alreadySubscribed) {
        return {
          ok: true,
          alreadySubscribed: true,
          message: 'You are already subscribed.',
          statusCode
        }
      }

      return {
        ok: true,
        alreadySubscribed: false,
        message: 'Subscribed. Please check your email.',
        statusCode
      }
    }

    if (statusCode === 400) {
      return {
        ok: false,
        alreadySubscribed: false,
        message: 'Please enter a valid email address.',
        statusCode
      }
    }

    if (statusCode === 502) {
      return {
        ok: false,
        alreadySubscribed: false,
        message: 'Subscription saved but confirmation is delayed. Please try again shortly.',
        statusCode
      }
    }

    if (statusCode === 503) {
      return {
        ok: false,
        alreadySubscribed: false,
        message: 'Newsletter is temporarily unavailable.',
        statusCode
      }
    }

    return {
      ok: false,
      alreadySubscribed: false,
      message: 'Something went wrong. Please try again.',
      statusCode
    }
  } catch {
    return {
      ok: false,
      alreadySubscribed: false,
      message: 'Something went wrong. Please try again.',
      statusCode: null
    }
  }
}

export const useNewsletterSubscription = (defaultSource = 'homepage-footer') => {
  const subscribing = ref(false)
  const statusCode = ref<number | null>(null)
  const message = ref<string | null>(null)
  const tone = ref<'success' | 'info' | 'error' | null>(null)

  const reset = () => {
    statusCode.value = null
    message.value = null
    tone.value = null
  }

  const submit = async (email: string, source?: string) => {
    if (subscribing.value) {
      return {
        ok: false,
        alreadySubscribed: false,
        message: message.value ?? '',
        statusCode: statusCode.value
      } satisfies NewsletterSubscribeResult
    }

    subscribing.value = true
    try {
      const result = await subscribeNewsletter(email, source ?? defaultSource)
      statusCode.value = result.statusCode
      message.value = result.message
      tone.value = result.ok ? (result.alreadySubscribed ? 'info' : 'success') : 'error'
      return result
    } finally {
      subscribing.value = false
    }
  }

  return { submit, subscribing, statusCode, message, tone, reset }
}

<template>
  <form :class="resolvedFormClass" @submit.prevent="onSubmit">
    <div class="w-full">
      <label :for="resolvedInputId" class="sr-only">Email address</label>
      <input
        :id="resolvedInputId"
        v-model="email"
        type="email"
        name="email"
        autocomplete="email"
        inputmode="email"
        :placeholder="placeholder"
        :required="required"
        :disabled="subscribing"
        :aria-invalid="tone === 'error' ? 'true' : undefined"
        :aria-describedby="message ? messageId : undefined"
        :class="resolvedInputClass"
      />
      <p
        v-if="message"
        :id="messageId"
        class="mt-3 text-sm"
        :class="resolvedMessageClass"
        :role="tone === 'error' ? 'alert' : 'status'"
        :aria-live="tone === 'error' ? 'assertive' : 'polite'"
        aria-atomic="true"
      >
        {{ message }}
      </p>
    </div>
    <button
      type="submit"
      :disabled="subscribing"
      :aria-disabled="subscribing ? 'true' : undefined"
      :class="resolvedButtonClass"
    >
      {{ subscribing ? loadingText : buttonText }}
    </button>
  </form>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    source?: string
    variant?: 'footer' | 'banner'
    inputId?: string
    placeholder?: string
    required?: boolean
    buttonText?: string
    loadingText?: string
    autoHideMs?: number
  }>(),
  {
    source: 'homepage-footer',
    variant: 'footer',
    inputId: undefined,
    placeholder: 'you@example.com',
    required: true,
    buttonText: 'Join',
    loadingText: 'Subscribing...',
    autoHideMs: 6000
  }
)

const resolvedInputId = computed(() => {
  if (props.inputId) return props.inputId
  return props.variant === 'banner' ? 'newsletter-email-banner' : 'newsletter-email-footer'
})

const messageId = computed(() => `${resolvedInputId.value}-message`)

const resolvedFormClass = computed(() => {
  return props.variant === 'banner' ? 'flex flex-col gap-4 lg:flex-row' : 'mt-4 flex gap-3'
})

const resolvedInputClass = computed(() => {
  return props.variant === 'banner'
    ? 'w-full rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-slate-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/40 disabled:cursor-not-allowed disabled:opacity-60'
    : 'w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60'
})

const resolvedButtonClass = computed(() => {
  return props.variant === 'banner'
    ? 'inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60'
    : 'inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60'
})

const resolvedMessageClass = computed(() => {
  if (tone.value === 'success') return props.variant === 'banner' ? 'text-emerald-200' : 'text-emerald-700'
  if (tone.value === 'info') return props.variant === 'banner' ? 'text-slate-200' : 'text-slate-600'
  if (tone.value === 'error') return props.variant === 'banner' ? 'text-rose-200' : 'text-rose-600'
  return props.variant === 'banner' ? 'text-slate-200' : 'text-slate-600'
})

const email = ref('')
const { submit, subscribing, message, tone, reset } = useNewsletterSubscription(props.source)

let hideTimer: ReturnType<typeof setTimeout> | null = null

const clearHideTimer = () => {
  if (!hideTimer) return
  clearTimeout(hideTimer)
  hideTimer = null
}

const scheduleAutoHide = () => {
  clearHideTimer()
  if (!props.autoHideMs || props.autoHideMs <= 0) return
  hideTimer = setTimeout(() => {
    message.value = null
    tone.value = null
    hideTimer = null
  }, props.autoHideMs)
}

onBeforeUnmount(() => {
  clearHideTimer()
})

const onSubmit = async () => {
  if (subscribing.value) return

  const trimmed = email.value.trim()
  clearHideTimer()
  reset()

  if (!isValidNewsletterEmail(trimmed)) {
    // Match backend 400 message without issuing a request.
    message.value = 'Please enter a valid email address.'
    tone.value = 'error'
    scheduleAutoHide()
    return
  }

  const result = await submit(trimmed, props.source)
  if (result.ok && result.statusCode === 201) {
    email.value = ''
  }
  scheduleAutoHide()
}
</script>

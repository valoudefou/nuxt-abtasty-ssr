<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-md align-middle transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    :class="props.class"
    :title="copied ? copiedTitle : title"
    :aria-label="ariaLabel"
    @click.stop="copy"
  >
    <slot />
    <component
      :is="copied ? ClipboardDocumentCheckIcon : ClipboardDocumentIcon"
      class="h-4 w-4 flex-shrink-0"
      :class="copied ? 'text-primary-600' : 'text-slate-400'"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
import { ClipboardDocumentCheckIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'

type NotificationType = 'success' | 'cart'

const props = defineProps<{
  text: string
  title?: string
  copiedTitle?: string
  ariaLabel?: string
  class?: string
  notify?: boolean
  notifyTitle?: string
  notifyMessage?: string
  notifyType?: NotificationType
}>()

const notifications = useNotifications()

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

const title = computed(() => props.title ?? 'Copy to clipboard')
const copiedTitle = computed(() => props.copiedTitle ?? 'Copied')
const ariaLabel = computed(() => props.ariaLabel ?? title.value)

const setCopied = () => {
  copied.value = true
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    copied.value = false
  }, 1500)

  if (props.notify) {
    notifications.show({
      type: props.notifyType ?? 'success',
      title: props.notifyTitle ?? 'Copied to clipboard',
      message: props.notifyMessage ?? 'Copied.'
    })
  }
}

const copy = async () => {
  if (!import.meta.client) return

  try {
    await navigator.clipboard.writeText(props.text)
    setCopied()
    return
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = props.text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (success) setCopied()
  } catch {
    // no-op
  }
}

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <TransitionGroup
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-for="notification in displayNotifications"
      :key="notification.id"
      class="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
    >
      <div class="flex-shrink-0">
        <component :is="notification.icon" class="h-6 w-6 text-primary-500" aria-hidden="true" />
      </div>
      <div>
        <p class="text-sm font-medium text-slate-900">{{ notification.title }}</p>
        <p class="mt-1 text-sm text-slate-600">{{ notification.message }}</p>
      </div>
      <button class="ml-auto text-slate-400 hover:text-slate-600" @click="dismiss(notification.id)">
        <span class="sr-only">Dismiss</span>
        ×
      </button>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { CheckCircleIcon, ShoppingBagIcon } from '@heroicons/vue/24/solid'

type NotificationType = 'success' | 'cart'

interface Notification {
  id: number
  title: string
  message: string
  icon: Component
}

const icons: Record<NotificationType, Component> = {
  success: CheckCircleIcon,
  cart: ShoppingBagIcon
}

const { notifications, dismiss } = useNotifications()

const displayNotifications = computed(() =>
  notifications.value.map((notification) => ({
    ...notification,
    icon: icons[notification.type]
  }))
)
</script>

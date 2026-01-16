<template>
  <Html lang="en">
    <Body class="min-h-screen bg-slate-50">
      <transition name="page-loader">
        <div
          v-if="isNavigating"
          class="fixed inset-0 z-50 flex items-center justify-center bg-white/70 px-6 py-10 backdrop-blur-sm"
        >
          <div class="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-6 shadow-xl">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                <div class="flex items-center gap-1">
                  <span class="page-loader-dot h-2 w-2 rounded-full bg-sky-500"></span>
                  <span class="page-loader-dot h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span class="page-loader-dot h-2 w-2 rounded-full bg-amber-500"></span>
                </div>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900">Loading next page</p>
                <p class="mt-1 text-sm text-slate-600">
                  Fetching the latest demo catalog data. Thanks for your patience.
                </p>
              </div>
            </div>
            <div class="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div class="page-loader-bar h-full w-1/2 bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400"></div>
            </div>
          </div>
        </div>
      </transition>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <UINotifications />
    </Body>
  </Html>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const appConfig = useRuntimeConfig()
const isNavigating = ref(false)

onMounted(() => {
  const router = useRouter()
  const stopBefore = router.beforeEach((to, from, next) => {
    if (to.fullPath !== from.fullPath) {
      isNavigating.value = true
    }
    next()
  })
  const stopAfter = router.afterEach(() => {
    isNavigating.value = false
  })
  const stopError = router.onError(() => {
    isNavigating.value = false
  })

  onBeforeUnmount(() => {
    stopBefore()
    stopAfter()
    stopError()
  })
})

useHead({
  bodyAttrs: {
    class: 'antialiased font-sans'
  },
  meta: [
    {
      name: 'keywords',
      content: `nuxt, ecommerce, ${appConfig.public.companyName}`
    }
  ]
})
</script>

<style scoped>
.page-loader-enter-active,
.page-loader-leave-active {
  transition: opacity 200ms ease;
}

.page-loader-enter-from,
.page-loader-leave-to {
  opacity: 0;
}

.page-loader-dot {
  animation: page-loader-bounce 1.2s ease-in-out infinite;
}

.page-loader-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.page-loader-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.page-loader-bar {
  animation: page-loader-bar 1.6s ease-in-out infinite;
}

@keyframes page-loader-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@keyframes page-loader-bar {
  0% {
    transform: translateX(-60%);
  }
  100% {
    transform: translateX(120%);
  }
}
</style>

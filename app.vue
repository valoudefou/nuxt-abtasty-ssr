<template>
  <Html lang="en">
    <Body class="min-h-screen bg-slate-50">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <UINotifications />
      <ClientOnly>
        <FlagshipLogPanel />
      </ClientOnly>
    </Body>
  </Html>
</template>

<script setup lang="ts">
const appConfig = useRuntimeConfig()
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

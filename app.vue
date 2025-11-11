<template>
  <Html lang="en">
    <Body class="min-h-screen bg-slate-50">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <UINotifications />
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
  ],
  script: [
    {
      src: 'https://try.abtasty.com/1ceff369b6cd9aceaa9ee318e6498167.js',
      type: 'text/javascript',
      defer: true
    }
  ]
})
</script>

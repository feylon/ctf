<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const title = computed(() => {
  if (props.error.statusCode === 404) return 'Sahifa topilmadi'
  if (props.error.statusCode === 403) return 'Ruxsat yo‘q'
  return 'Xatolik yuz berdi'
})
</script>

<template>
  <UApp>
    <div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <p class="font-mono text-7xl font-bold text-primary">
        {{ error.statusCode }}
      </p>
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          {{ title }}
        </h1>
        <p class="mt-2 text-muted">
          {{ error.statusMessage || error.message }}
        </p>
      </div>
      <UButton icon="i-lucide-house" label="Bosh sahifaga qaytish" @click="clearError({ redirect: '/' })" />
    </div>
  </UApp>
</template>

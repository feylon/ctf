<script setup lang="ts">
// useConfirm() orqali dasturiy ochiladigan tasdiqlash oynasi
withDefaults(defineProps<{
  title?: string
  description?: string
  confirmLabel?: string
  color?: 'error' | 'primary' | 'warning'
}>(), {
  title: 'Ishonchingiz komilmi?',
  description: '',
  confirmLabel: 'Tasdiqlash',
  color: 'error',
})

const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal :title="title" :description="description" :close="false" @update:open="(open: boolean) => !open && emit('close', false)">
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" label="Bekor qilish" @click="emit('close', false)" />
        <UButton :color="color" :label="confirmLabel" @click="emit('close', true)" />
      </div>
    </template>
  </UModal>
</template>

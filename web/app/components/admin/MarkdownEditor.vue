<script setup lang="ts">
// Markdown matn kiritish: yozish va oldindan ko'rish yorliqlari bilan
withDefaults(defineProps<{ rows?: number, placeholder?: string }>(), { rows: 8, placeholder: '' })
const model = defineModel<string>({ default: '' })
const tab = ref('write')
</script>

<template>
  <UTabs
    v-model="tab"
    :items="[{ label: 'Yozish', value: 'write', slot: 'write' }, { label: 'Ko‘rish', value: 'preview', slot: 'preview' }]"
    variant="link"
    size="sm"
  >
    <template #write>
      <UTextarea v-model="model" :rows="rows" autoresize :maxrows="20" :placeholder="placeholder" class="w-full font-mono" />
    </template>
    <template #preview>
      <div class="min-h-40 rounded-md border border-default p-4">
        <MarkdownContent v-if="model" :content="model" />
        <p v-else class="text-sm text-muted">
          Ko‘rsatish uchun matn yo‘q
        </p>
      </div>
    </template>
  </UTabs>
</template>

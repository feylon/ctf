<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Admin kiritgan Markdown matnni xavfsiz HTML ga aylantiradi
const props = defineProps<{ content?: string | null }>()

const html = computed(() => {
  if (!props.content) return ''
  const raw = marked.parse(props.content, { async: false, gfm: true, breaks: true }) as string
  return DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] })
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown" v-html="html" />
</template>

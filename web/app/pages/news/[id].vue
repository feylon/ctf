<script setup lang="ts">
import type { News } from '~/types/api'

const route = useRoute()
const api = useApi()
const id = computed(() => String(route.params.id))

const { data: news, status, error } = await useAsyncData(
  () => `news:${id.value}`,
  () => api.get<News>(`/news/${id.value}`, undefined, { auth: false }),
)

useHead(() => ({ title: news.value ? `${news.value.title} — CTF Platforma` : 'Yangilik — CTF Platforma' }))
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <UButton to="/news" variant="link" color="neutral" icon="i-lucide-arrow-left" label="Barcha yangiliklar" class="mb-4 px-0" />

    <div v-if="status === 'pending' && !news" class="space-y-4">
      <USkeleton class="h-8 w-2/3" />
      <USkeleton class="h-4 w-1/3" />
      <USkeleton class="h-64 w-full" />
    </div>

    <UEmpty
      v-else-if="error || !news"
      icon="i-lucide-file-x"
      title="Yangilik topilmadi"
      :description="error ? apiErrorMessage(error) : 'Bu yangilik o‘chirilgan yoki mavjud emas'"
      :actions="[{ label: 'Yangiliklarga qaytish', to: '/news', icon: 'i-lucide-arrow-left' }]"
    />

    <article v-else>
      <h1 class="text-3xl font-bold text-highlighted">
        {{ news.title }}
      </h1>
      <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-calendar" /> {{ formatDateTime(news.createdAt) }}
        </span>
        <span v-if="news.author" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-user" /> {{ news.author.fullName || news.author.username }}
        </span>
      </div>
      <USeparator class="my-6" />
      <MarkdownContent :content="news.content" />
    </article>
  </div>
</template>

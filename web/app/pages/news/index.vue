<script setup lang="ts">
import type { News, Paginated } from '~/types/api'

useHead({ title: 'Yangiliklar — CTF Platforma' })

const api = useApi()
const page = ref(1)
const limit = 10

const { data, status, error, refresh } = await useAsyncData(
  'news:list',
  () => api.get<Paginated<News>>('/news/pagination', { page: page.value, limit }, { auth: false }),
  { watch: [page] },
)

// Markdown belgilarini olib tashlab, qisqa matn hosil qiladi
function excerpt(content: string, max = 220) {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

watch(page, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <PageHeading title="Yangiliklar" description="Musobaqa e‘lonlari va platforma yangiliklari" icon="i-lucide-newspaper" />

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="apiErrorMessage(error)">
      <template #actions>
        <UButton size="xs" color="error" variant="outline" label="Qayta urinish" @click="() => refresh()" />
      </template>
    </UAlert>

    <div v-else-if="status === 'pending' && !data" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-32 w-full" />
    </div>

    <UEmpty
      v-else-if="!data?.data.length"
      icon="i-lucide-newspaper"
      title="Hozircha yangiliklar yo‘q"
      description="Yangi e‘lonlar shu yerda paydo bo‘ladi"
    />

    <div v-else class="space-y-4">
      <NuxtLink v-for="item in data.data" :key="item.id" :to="`/news/${item.id}`" class="block">
        <UCard class="transition hover:ring-primary/50">
          <div class="flex items-center gap-2 text-xs text-muted">
            <UIcon name="i-lucide-calendar" />
            <span :title="formatDateTime(item.createdAt)">{{ formatDate(item.createdAt) }}</span>
            <template v-if="item.author">
              <span>·</span>
              <span>{{ item.author.fullName || item.author.username }}</span>
            </template>
          </div>
          <h2 class="mt-2 text-lg font-semibold text-highlighted">
            {{ item.title }}
          </h2>
          <p class="mt-2 text-sm text-muted">
            {{ excerpt(item.content) }}
          </p>
          <span class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Batafsil <UIcon name="i-lucide-arrow-right" />
          </span>
        </UCard>
      </NuxtLink>

      <div v-if="data.meta.totalPages > 1" class="flex justify-center pt-2">
        <UPagination v-model:page="page" :total="data.meta.total" :items-per-page="limit" />
      </div>
    </div>
  </div>
</template>

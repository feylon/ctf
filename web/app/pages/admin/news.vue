<script setup lang="ts">
import type { News, Paginated } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Yangiliklar — Admin' })

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()

const page = ref(1)
const limit = 10
const result = ref<Paginated<News> | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    result.value = await api.get<Paginated<News>>('/news/pagination', { page: page.value, limit })
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}
watch(page, load)
onMounted(load)

// Yaratish / tahrirlash oynasi
const modalOpen = ref(false)
const editing = ref<News | null>(null)
const form = reactive({ title: '', content: '' })
const saving = ref(false)

function openCreate() {
  editing.value = null
  form.title = ''
  form.content = ''
  modalOpen.value = true
}

function openEdit(news: News) {
  editing.value = news
  form.title = news.title
  form.content = news.content
  modalOpen.value = true
}

async function save() {
  if (!form.title.trim() || !form.content.trim()) return
  saving.value = true
  try {
    const body = { title: form.title.trim(), content: form.content }
    if (editing.value) {
      await api.patch(`/admin/news/${editing.value.id}`, body)
      notify.success('Yangilik tahrirlandi')
    }
    else {
      await api.post('/admin/news', body)
      notify.success('Yangilik e‘lon qilindi')
    }
    modalOpen.value = false
    await load()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    saving.value = false
  }
}

async function remove(news: News) {
  if (!await confirm({ title: 'Yangilikni o‘chirish', description: `"${news.title}" o‘chirilsinmi?`, confirmLabel: 'O‘chirish' })) return
  try {
    await api.del(`/admin/news/${news.id}`)
    notify.success('Yangilik o‘chirildi')
    if (result.value?.data.length === 1 && page.value > 1) page.value--
    else await load()
  }
  catch (e) {
    notify.error(e)
  }
}
</script>

<template>
  <AdminPanel title="Yangiliklar" icon="i-lucide-newspaper">
    <template #actions>
      <UButton icon="i-lucide-plus" label="Yangi e‘lon" @click="openCreate" />
    </template>

    <div v-if="loading && !result" class="flex flex-col gap-4">
      <USkeleton v-for="i in 3" :key="i" class="h-32" />
    </div>

    <UEmpty
      v-else-if="!result?.data.length"
      icon="i-lucide-newspaper"
      title="Yangiliklar yo‘q"
      description="Ishtirokchilar uchun birinchi e‘lonni yozing"
      :actions="[{ label: 'E‘lon yozish', icon: 'i-lucide-plus', onClick: openCreate }]"
    />

    <div v-else class="flex flex-col gap-4">
      <UCard v-for="news in result.data" :key="news.id">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h3 class="font-semibold text-highlighted">
              {{ news.title }}
            </h3>
            <p class="mt-1 text-xs text-muted">
              {{ formatDateTime(news.createdAt) }} · {{ news.author?.fullName || news.author?.username || 'Noma‘lum' }}
            </p>
          </div>
          <div class="flex shrink-0 gap-1">
            <UButton icon="i-lucide-external-link" color="neutral" variant="ghost" size="sm" :to="`/news/${news.id}`" target="_blank" />
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" @click="openEdit(news)" />
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="remove(news)" />
          </div>
        </div>
        <MarkdownContent :content="news.content" class="mt-3 line-clamp-4 text-sm" />
      </UCard>

      <div v-if="result.meta.totalPages > 1" class="flex justify-center">
        <UPagination v-model:page="page" :total="result.meta.total" :items-per-page="limit" />
      </div>
    </div>

    <UModal v-model:open="modalOpen" :title="editing ? 'Yangilikni tahrirlash' : 'Yangi e‘lon'" :ui="{ content: 'sm:max-w-2xl' }">
      <template #body>
        <form id="news-form" class="flex flex-col gap-4" @submit.prevent="save">
          <UFormField label="Sarlavha" required>
            <UInput v-model="form.title" :maxlength="255" placeholder="Musobaqa boshlanish vaqti o‘zgardi" class="w-full" />
          </UFormField>
          <UFormField label="Matn (Markdown)" required>
            <AdminMarkdownEditor v-model="form.content" :rows="10" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Bekor qilish" @click="modalOpen = false" />
          <UButton type="submit" form="news-form" :loading="saving" :disabled="!form.title.trim() || !form.content.trim()" :label="editing ? 'Saqlash' : 'E‘lon qilish'" />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>

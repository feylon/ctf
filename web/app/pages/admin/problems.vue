<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { AdminProblem, Paginated } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Masalalar — Admin' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()

const page = ref(1)
const limit = 20
const search = ref('')
const debouncedSearch = ref('')
const result = ref<Paginated<AdminProblem> | null>(null)
const loading = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => (debouncedSearch.value = value.trim()), 400)
})

async function load() {
  loading.value = true
  try {
    result.value = await api.get<Paginated<AdminProblem>>('/admin/problems', {
      page: page.value,
      limit,
      search: debouncedSearch.value || undefined,
    })
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}
watch(debouncedSearch, () => {
  page.value = 1
  load()
})
watch(page, load)
onMounted(load)

const formOpen = ref(false)
const editing = ref<AdminProblem | null>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(p: AdminProblem) {
  editing.value = p
  formOpen.value = true
}

async function remove(p: AdminProblem) {
  if (!await confirm({
    title: 'Masalani o‘chirish',
    description: `"${p.code} — ${p.title}" o‘chirilsinmi? Yechgan foydalanuvchilardan ballar qaytarib olinadi.`,
    confirmLabel: 'O‘chirish',
  })) return
  try {
    await api.del(`/admin/problems/${p.id}`)
    notify.success('Masala o‘chirildi')
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}

const columns: TableColumn<AdminProblem>[] = [
  { accessorKey: 'code', header: 'Kod', cell: ({ row }) => h('span', { class: 'font-mono font-medium' }, row.original.code) },
  { accessorKey: 'title', header: 'Nomi', cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, row.original.title) },
  { accessorKey: 'category', header: 'Toifa', cell: ({ row }) => h(UBadge, { color: categoryColor(row.original.category), variant: 'subtle', label: row.original.category }) },
  {
    accessorKey: 'difficulty',
    header: 'Qiyinlik',
    cell: ({ row }) => {
      const meta = difficultyMeta(row.original.difficulty)
      return h(UBadge, { color: meta.color, variant: 'outline', label: `${meta.label} · ${row.original.difficulty}` })
    },
  },
  { accessorKey: 'points', header: 'Ball', cell: ({ row }) => h('span', { class: 'tabular-nums' }, row.original.points) },
  {
    id: 'stats',
    header: 'Yechildi / Urinish',
    cell: ({ row }) => {
      const p = row.original
      const rate = p.totalTries ? Math.round((p.solvedCount / p.totalTries) * 100) : 0
      return h('span', { class: 'tabular-nums' }, `${p.solvedCount} / ${p.totalTries} (${rate}%)`)
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, { icon: 'i-lucide-external-link', color: 'neutral', variant: 'ghost', size: 'sm', to: `/problems/${row.original.id}`, target: '_blank' }),
      h(UButton, { icon: 'i-lucide-pencil', color: 'neutral', variant: 'ghost', size: 'sm', onClick: () => openEdit(row.original) }),
      h(UButton, { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'sm', onClick: () => remove(row.original) }),
    ]),
  },
]
</script>

<template>
  <AdminPanel title="Masalalar" icon="i-lucide-code-xml">
    <template #actions>
      <UButton icon="i-lucide-plus" label="Yangi masala" @click="openCreate" />
    </template>

    <template #toolbar>
      <div class="flex w-full items-center gap-2 py-1">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Kod yoki nomi..." class="w-full sm:w-72" />
        <span class="ml-auto text-sm text-muted">Jami: {{ result?.meta.total ?? 0 }}</span>
      </div>
    </template>

    <UTable :data="result?.data ?? []" :columns="columns" :loading="loading" empty="Masalalar topilmadi" />

    <div v-if="(result?.meta.totalPages ?? 0) > 1" class="flex justify-center border-t border-default pt-4">
      <UPagination v-model:page="page" :total="result?.meta.total ?? 0" :items-per-page="limit" />
    </div>

    <AdminProblemForm v-model:open="formOpen" :problem="editing" @saved="load" />
  </AdminPanel>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { AdminChallenge, AdminGroup } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Vazifalar — Admin' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const { isAdmin } = useAuth()

const challenges = ref<AdminChallenge[]>([])
const groups = ref<AdminGroup[]>([])
const loading = ref(true)
const search = ref('')
const groupFilter = ref('all')

async function load() {
  loading.value = true
  try {
    ;[challenges.value, groups.value] = await Promise.all([
      api.get<AdminChallenge[]>('/admin/challenges'),
      api.get<AdminGroup[]>('/admin/groups'),
    ])
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}
onMounted(load)

const categories = computed(() => [...new Set(challenges.value.map(c => c.category))].sort())
const groupItems = computed(() => [{ label: 'Barcha guruhlar', value: 'all' }, ...groups.value.map(g => ({ label: g.name, value: g.id }))])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return challenges.value.filter(c =>
    (groupFilter.value === 'all' || c.group?.id === groupFilter.value)
    && (!q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)),
  )
})

// Forma oynasi
const formOpen = ref(false)
const editing = ref<AdminChallenge | null>(null)

function openCreate() {
  if (!groups.value.length) {
    notify.info('Avval guruh yarating', 'Vazifalar guruhga biriktiriladi')
    return
  }
  editing.value = null
  formOpen.value = true
}

function openEdit(c: AdminChallenge) {
  editing.value = c
  formOpen.value = true
}

async function remove(c: AdminChallenge) {
  if (!await confirm({
    title: 'Vazifani o‘chirish',
    description: `"${c.title}" va unga tegishli barcha yechimlar o‘chiriladi. Jamoalarga berilgan ballar qaytarib olinadi.`,
    confirmLabel: 'O‘chirish',
  })) return
  try {
    await api.del(`/admin/challenges/${c.id}`)
    notify.success('Vazifa o‘chirildi')
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}

function timeWindow(c: AdminChallenge) {
  if (!c.startTime && !c.endTime) return 'Cheklovsiz'
  return `${c.startTime ? formatDateTime(c.startTime) : '…'} — ${c.endTime ? formatDateTime(c.endTime) : '…'}`
}

const columns = computed<TableColumn<AdminChallenge>[]>(() => [
  {
    accessorKey: 'title',
    header: 'Vazifa',
    cell: ({ row }) => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'font-medium text-highlighted' }, row.original.title),
      h('p', { class: 'text-xs text-muted' }, row.original.group?.name ?? 'Guruhsiz'),
    ]),
  },
  {
    accessorKey: 'category',
    header: 'Kategoriya',
    cell: ({ row }) => h(UBadge, { color: categoryColor(row.original.category), variant: 'subtle', icon: categoryIcon(row.original.category), label: row.original.category }),
  },
  {
    id: 'points',
    header: 'Ball',
    cell: ({ row }) => h('div', { class: 'tabular-nums' }, [
      h('span', { class: 'font-semibold text-highlighted' }, row.original.points),
      h('span', { class: 'text-xs text-muted' }, ` / ${row.original.initialPoints} (min ${row.original.minPoints}, −${row.original.decrementStep})`),
    ]),
  },
  {
    id: 'stats',
    header: 'Yechildi / Urinish',
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, `${row.original.solves ?? 0} / ${row.original.attempts ?? 0}`),
  },
  { id: 'time', header: 'Vaqt oralig‘i', cell: ({ row }) => h('span', { class: 'text-xs text-muted' }, timeWindow(row.original)) },
  {
    id: 'ip',
    header: 'IP',
    cell: ({ row }) => row.original.allowedIpRange && row.original.allowedIpRange !== '*'
      ? h(UBadge, { color: 'warning', variant: 'outline', class: 'font-mono', label: row.original.allowedIpRange })
      : h('span', { class: 'text-muted' }, 'Hamma'),
  },
  {
    id: 'file',
    header: '',
    cell: ({ row }) => row.original.attachmentPath
      ? h(UTooltip, { text: row.original.attachmentPath }, () => h(UButton, { icon: 'i-lucide-paperclip', color: 'neutral', variant: 'ghost', size: 'sm', to: fileUrl(row.original.attachmentPath), target: '_blank' }))
      : null,
  },
  ...(isAdmin.value
    ? [{
        id: 'actions',
        cell: ({ row }: { row: { original: AdminChallenge } }) => h('div', { class: 'flex justify-end gap-1' }, [
          h(UButton, { icon: 'i-lucide-pencil', color: 'neutral', variant: 'ghost', size: 'sm', onClick: () => openEdit(row.original) }),
          h(UButton, { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'sm', onClick: () => remove(row.original) }),
        ]),
      } as TableColumn<AdminChallenge>]
    : []),
])
</script>

<template>
  <AdminPanel title="Vazifalar (CTF)" icon="i-lucide-flag">
    <template #actions>
      <UButton v-if="isAdmin" icon="i-lucide-plus" label="Yangi vazifa" @click="openCreate" />
    </template>

    <template #toolbar>
      <div class="flex w-full flex-wrap items-center gap-2 py-1">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Nomi yoki kategoriya..." class="w-full sm:w-64" />
        <USelect v-model="groupFilter" :items="groupItems" class="w-52" />
        <span class="ml-auto text-sm text-muted">Jami: {{ filtered.length }}</span>
      </div>
    </template>

    <UTable :data="filtered" :columns="columns" :loading="loading" empty="Vazifalar topilmadi" />

    <AdminChallengeForm v-model:open="formOpen" :challenge="editing" :groups="groups" :categories="categories" @saved="load" />
  </AdminPanel>
</template>

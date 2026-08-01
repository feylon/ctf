<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { AdminChallenge, AdminSubmission, AdminTeam, Paginated } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Yechimlar — Admin' })

const UBadge = resolveComponent('UBadge')

const api = useApi()
const notify = useNotify()

const page = ref(1)
const limit = 25
const challengeId = ref('all')
const teamId = ref('all')
const correctness = ref<'all' | 'true' | 'false'>('all')
const autoRefresh = ref(false)

const result = ref<Paginated<AdminSubmission> | null>(null)
const challenges = ref<AdminChallenge[]>([])
const teams = ref<AdminTeam[]>([])
const loading = ref(false)

async function load(silent = false) {
  if (!silent) loading.value = true
  try {
    result.value = await api.get<Paginated<AdminSubmission>>('/admin/submissions', {
      page: page.value,
      limit,
      challengeId: challengeId.value === 'all' ? undefined : challengeId.value,
      teamId: teamId.value === 'all' ? undefined : teamId.value,
      isCorrect: correctness.value === 'all' ? undefined : correctness.value,
    })
  }
  catch (e) {
    if (!silent) notify.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  load()
  try {
    ;[challenges.value, teams.value] = await Promise.all([
      api.get<AdminChallenge[]>('/admin/challenges'),
      api.get<AdminTeam[]>('/admin/teams'),
    ])
  }
  catch {
    // Filtrlar uchun ro'yxatlar yuklanmasa ham jadval ishlaydi
  }
})

watch([challengeId, teamId, correctness], () => {
  page.value = 1
  load()
})
watch(page, () => load())

// Har 10 soniyada avtomatik yangilash
let timer: ReturnType<typeof setInterval> | undefined
watch(autoRefresh, (on) => {
  clearInterval(timer)
  if (on) timer = setInterval(() => load(true), 10_000)
})
onBeforeUnmount(() => clearInterval(timer))

const challengeItems = computed(() => [{ label: 'Barcha vazifalar', value: 'all' }, ...challenges.value.map(c => ({ label: c.title, value: c.id }))])
const teamItems = computed(() => [{ label: 'Barcha jamoalar', value: 'all' }, ...teams.value.map(t => ({ label: t.name, value: t.id }))])
const correctItems = [
  { label: 'Barchasi', value: 'all' },
  { label: 'To‘g‘ri', value: 'true' },
  { label: 'Noto‘g‘ri', value: 'false' },
]

const columns: TableColumn<AdminSubmission>[] = [
  { accessorKey: 'submittedAt', header: 'Vaqt', cell: ({ row }) => h('span', { class: 'text-sm text-muted whitespace-nowrap' }, formatDateTime(row.original.submittedAt)) },
  { id: 'team', header: 'Jamoa', cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, row.original.team?.name ?? '—') },
  { id: 'user', header: 'Foydalanuvchi', cell: ({ row }) => row.original.user?.username ?? '—' },
  { id: 'challenge', header: 'Vazifa', cell: ({ row }) => row.original.challenge?.title ?? 'O‘chirilgan' },
  {
    id: 'result',
    header: 'Natija',
    cell: ({ row }) => {
      const s = row.original
      if (!s.isCorrect) return h(UBadge, { color: 'error', variant: 'subtle', icon: 'i-lucide-x', label: 'Noto‘g‘ri' })
      if (s.pointsAwarded > 0) return h(UBadge, { color: 'success', variant: 'subtle', icon: 'i-lucide-check', label: `+${s.pointsAwarded}` })
      return h(UBadge, { color: 'neutral', variant: 'subtle', icon: 'i-lucide-repeat', label: 'Takroriy' })
    },
  },
]
</script>

<template>
  <AdminPanel title="Yechimlar" icon="i-lucide-list-checks">
    <template #actions>
      <USwitch v-model="autoRefresh" label="Avto-yangilash" />
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="loading" @click="load()" />
    </template>

    <template #toolbar>
      <div class="flex w-full flex-wrap items-center gap-2 py-1">
        <USelect v-model="challengeId" :items="challengeItems" class="w-56" />
        <USelect v-model="teamId" :items="teamItems" class="w-48" />
        <USelect v-model="correctness" :items="correctItems" class="w-36" />
        <span class="ml-auto text-sm text-muted">Jami: {{ result?.meta.total ?? 0 }}</span>
      </div>
    </template>

    <UTable :data="result?.data ?? []" :columns="columns" :loading="loading" empty="Yechimlar topilmadi" />

    <div v-if="(result?.meta.totalPages ?? 0) > 1" class="flex justify-center border-t border-default pt-4">
      <UPagination v-model:page="page" :total="result?.meta.total ?? 0" :items-per-page="limit" />
    </div>
  </AdminPanel>
</template>

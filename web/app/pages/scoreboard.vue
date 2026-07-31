<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Paginated, ScoreboardRow, TimelineSeries, UserLeaderboardRow } from '~/types/api'

useHead({ title: 'Reyting — CTF Platforma' })

const api = useApi()
const notify = useNotify()
const { user } = useAuth()

const tab = ref<'teams' | 'users'>('teams')
const tabs = [
  { label: 'Jamoalar (CTF)', value: 'teams', icon: 'i-lucide-shield-half' },
  { label: 'Foydalanuvchilar (masalalar)', value: 'users', icon: 'i-lucide-user' },
]

const teams = ref<ScoreboardRow[]>([])
const timeline = ref<TimelineSeries[]>([])
const users = ref<Paginated<UserLeaderboardRow> | null>(null)
const userPage = ref(1)
const loading = ref(true)
const updatedAt = ref<Date | null>(null)

const myTeamId = computed(() => user.value?.team?.id ?? null)

async function loadTeams() {
  const [board, series] = await Promise.all([
    api.get<ScoreboardRow[]>('/tournament/scoreboard', undefined, { auth: false }),
    api.get<TimelineSeries[]>('/tournament/scoreboard/timeline', undefined, { auth: false }),
  ])
  teams.value = board
  timeline.value = series
}

async function loadUsers() {
  users.value = await api.get<Paginated<UserLeaderboardRow>>('/problems/leaderboard', { page: userPage.value, limit: 25 }, { auth: false })
}

async function load(silent = false) {
  if (!silent) loading.value = true
  try {
    await (tab.value === 'teams' ? loadTeams() : loadUsers())
    updatedAt.value = new Date()
  }
  catch (e) {
    if (!silent) notify.error(e)
  }
  finally {
    loading.value = false
  }
}

watch(tab, () => load())
watch(userPage, () => load())

// Har 30 soniyada jim yangilanadi
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  load()
  timer = setInterval(() => load(true), 30_000)
})
onBeforeUnmount(() => clearInterval(timer))

const MEDALS = ['text-yellow-400', 'text-zinc-300', 'text-amber-600']

function rankCell(rank: number) {
  if (rank <= 3) {
    return h('span', { class: 'flex items-center gap-1 font-mono font-bold' }, [
      h(resolveComponent('UIcon'), { name: 'i-lucide-medal', class: `size-5 ${MEDALS[rank - 1]}` }),
      String(rank),
    ])
  }
  return h('span', { class: 'font-mono text-muted pl-6' }, String(rank))
}

const teamColumns: TableColumn<ScoreboardRow>[] = [
  { accessorKey: 'rank', header: '#', cell: ({ row }) => rankCell(row.original.rank) },
  {
    accessorKey: 'name',
    header: 'Jamoa',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h('span', { class: 'font-semibold text-highlighted' }, row.original.name),
      row.original.id === myTeamId.value
        ? h(resolveComponent('UBadge'), { color: 'primary', variant: 'subtle', size: 'sm', label: 'Sizning jamoangiz' })
        : null,
    ]),
  },
  {
    accessorKey: 'members',
    header: 'A‘zolar',
    cell: ({ row }) => h('span', { class: 'text-muted' }, row.original.members.map(m => m.username).join(', ') || '—'),
  },
  { accessorKey: 'solves', header: 'Yechimlar', cell: ({ row }) => h('span', { class: 'font-mono' }, String(row.original.solves)) },
  {
    accessorKey: 'lastSolveAt',
    header: 'Oxirgi yechim',
    cell: ({ row }) => h('span', { class: 'text-muted' }, row.original.lastSolveAt ? timeAgo(row.original.lastSolveAt) : '—'),
  },
  {
    accessorKey: 'score',
    header: () => h('span', { class: 'block text-right' }, 'Ball'),
    cell: ({ row }) => h('span', { class: 'block text-right font-mono text-lg font-bold text-primary' }, String(row.original.score)),
  },
]

const userColumns: TableColumn<UserLeaderboardRow>[] = [
  { accessorKey: 'rank', header: '#', cell: ({ row }) => rankCell(row.original.rank) },
  {
    accessorKey: 'username',
    header: 'Foydalanuvchi',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(resolveComponent('UAvatar'), { text: row.original.username[0]?.toUpperCase(), size: 'xs' }),
      h('div', [
        h('p', { class: 'font-semibold text-highlighted' }, [
          row.original.username,
          row.original.id === user.value?.id ? h('span', { class: 'ml-1 text-xs font-normal text-primary' }, '(siz)') : null,
        ]),
        row.original.fullName ? h('p', { class: 'text-xs text-muted' }, row.original.fullName) : null,
      ]),
    ]),
  },
  { accessorKey: 'solved', header: 'Yechilgan', cell: ({ row }) => h('span', { class: 'font-mono' }, String(row.original.solved)) },
  {
    accessorKey: 'score',
    header: () => h('span', { class: 'block text-right' }, 'Ball'),
    cell: ({ row }) => h('span', { class: 'block text-right font-mono text-lg font-bold text-primary' }, String(row.original.score)),
  },
]

// Joriy foydalanuvchi jamoasi qatorini ajratib ko'rsatish
const teamRowClass = (row: { original: ScoreboardRow }) => (row.original.id === myTeamId.value ? 'bg-primary/10' : '')
</script>

<template>
  <div>
    <PageHeading title="Reyting" description="Jamoalar va foydalanuvchilarning jonli reyting jadvali" icon="i-lucide-trophy">
      <template #actions>
        <span v-if="updatedAt" class="text-xs text-muted">Yangilandi: {{ formatDateTime(updatedAt) }}</span>
        <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" aria-label="Yangilash" :loading="loading" @click="load()" />
      </template>
    </PageHeading>

    <UTabs v-model="tab" :items="tabs" :content="false" class="mb-6" />

    <div v-if="tab === 'teams'" class="space-y-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-highlighted">
              Top jamoalar ball dinamikasi
            </h2>
            <span class="text-xs text-muted">Grafikda eng ko‘pi bilan 8 ta jamoa</span>
          </div>
        </template>
        <USkeleton v-if="loading && !timeline.length" class="h-72" />
        <UEmpty v-else-if="!timeline.some(s => s.points.length)" icon="i-lucide-chart-line" title="Hali yechimlar yo‘q" description="Birinchi flag yuborilgach grafik paydo bo‘ladi." />
        <ScoreTimelineChart v-else :series="timeline" :highlight-id="myTeamId" />
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <UTable
          :data="teams"
          :columns="teamColumns"
          :loading="loading && !teams.length"
          :meta="{ class: { tr: teamRowClass } }"
          empty="Reytingda hali jamoalar yo‘q"
        />
      </UCard>
    </div>

    <div v-else class="space-y-4">
      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <UTable :data="users?.data ?? []" :columns="userColumns" :loading="loading" empty="Hali masala yechgan foydalanuvchilar yo‘q" />
      </UCard>
      <div v-if="(users?.meta.totalPages ?? 0) > 1" class="flex justify-center">
        <UPagination v-model:page="userPage" :total="users?.meta.total ?? 0" :items-per-page="users?.meta.limit ?? 25" />
      </div>
    </div>
  </div>
</template>

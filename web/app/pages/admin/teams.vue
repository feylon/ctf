<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { AdminTeam } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Jamoalar — Admin' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const { isAdmin } = useAuth()

const teams = ref<AdminTeam[]>([])
const loading = ref(true)
const search = ref('')

async function load() {
  loading.value = true
  try {
    teams.value = await api.get<AdminTeam[]>('/admin/teams')
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return teams.value
  return teams.value.filter(t => t.name.toLowerCase().includes(q) || t.members.some(m => m.username.toLowerCase().includes(q)))
})

// Ballni o'zgartirish oynasi
const scoreOpen = ref(false)
const scoreTeam = ref<AdminTeam | null>(null)
const scoreForm = reactive({ points: 0, reason: '' })
const scoreSaving = ref(false)

function openScore(team: AdminTeam) {
  scoreTeam.value = team
  scoreForm.points = 0
  scoreForm.reason = ''
  scoreOpen.value = true
}

async function saveScore() {
  if (!scoreTeam.value || !scoreForm.points || !scoreForm.reason.trim()) return
  scoreSaving.value = true
  try {
    const res = await api.patch<{ message: string }>(`/admin/teams/${scoreTeam.value.id}/score`, {
      points: Number(scoreForm.points),
      reason: scoreForm.reason.trim(),
    })
    notify.success(res.message)
    scoreOpen.value = false
    await load()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    scoreSaving.value = false
  }
}

async function toggleBan(team: AdminTeam) {
  if (!team.isBanned && !await confirm({ title: 'Jamoani bloklash', description: `"${team.name}" bloklansinmi? U reytingdan chiqariladi va flag yubora olmaydi.`, confirmLabel: 'Bloklash' })) return
  try {
    const res = await api.patch<{ message: string }>(`/admin/teams/${team.id}/ban`)
    notify.success(res.message)
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}

async function remove(team: AdminTeam) {
  if (!await confirm({ title: 'Jamoani o‘chirish', description: `"${team.name}" va uning barcha yechimlari o‘chiriladi. A‘zolar jamoasiz qoladi.`, confirmLabel: 'O‘chirish' })) return
  try {
    await api.del(`/admin/teams/${team.id}`)
    notify.success('Jamoa o‘chirildi')
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}

async function copyInvite(team: AdminTeam) {
  await navigator.clipboard.writeText(team.inviteCode)
  notify.success('Taklif kodi nusxalandi', team.inviteCode)
}

function rowActions(team: AdminTeam): DropdownMenuItem[][] {
  const items: DropdownMenuItem[][] = [
    [
      { label: 'Ballni o‘zgartirish', icon: 'i-lucide-plus-minus', onSelect: () => openScore(team) },
      { label: 'Taklif kodini nusxalash', icon: 'i-lucide-copy', onSelect: () => copyInvite(team) },
    ],
    [{ label: team.isBanned ? 'Blokdan chiqarish' : 'Bloklash', icon: team.isBanned ? 'i-lucide-lock-open' : 'i-lucide-ban', onSelect: () => toggleBan(team) }],
  ]
  if (isAdmin.value) items.push([{ label: 'O‘chirish', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => remove(team) }])
  return items
}

const columns: TableColumn<AdminTeam>[] = [
  {
    id: 'rank',
    header: '#',
    cell: ({ row }) => h('span', { class: 'font-mono text-muted' }, row.index + 1),
  },
  {
    accessorKey: 'name',
    header: 'Jamoa',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h('span', { class: 'font-medium text-highlighted' }, row.original.name),
      row.original.isBanned ? h(UBadge, { color: 'error', variant: 'subtle', size: 'sm', label: 'Bloklangan' }) : null,
    ]),
  },
  {
    id: 'members',
    header: 'A‘zolar',
    cell: ({ row }) => h('div', { class: 'flex flex-wrap gap-1' }, row.original.members.length
      ? row.original.members.map(m => h(UBadge, {
          color: m.id === row.original.captain?.id ? 'primary' : 'neutral',
          variant: 'subtle',
          icon: m.id === row.original.captain?.id ? 'i-lucide-crown' : undefined,
          label: m.username,
        }))
      : [h('span', { class: 'text-muted text-sm' }, 'A‘zolar yo‘q')]),
  },
  {
    id: 'groups',
    header: 'Guruhlar',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.challengeGroups.map(g => g.name).join(', ') || '—'),
  },
  {
    id: 'invite',
    header: 'Taklif kodi',
    cell: ({ row }) => h('code', { class: 'font-mono text-xs' }, row.original.inviteCode),
  },
  { accessorKey: 'solves', header: 'Yechimlar', cell: ({ row }) => h('span', { class: 'tabular-nums' }, row.original.solves) },
  { accessorKey: 'score', header: 'Ball', cell: ({ row }) => h('span', { class: 'font-semibold tabular-nums text-highlighted' }, row.original.score) },
  {
    id: 'actions',
    cell: ({ row }) => h('div', { class: 'text-right' }, h(UDropdownMenu, { items: rowActions(row.original), content: { align: 'end' } }, () =>
      h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' }))),
  },
]
</script>

<template>
  <AdminPanel title="Jamoalar" icon="i-lucide-shield-half">
    <template #actions>
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="loading" @click="load" />
    </template>

    <template #toolbar>
      <div class="flex w-full items-center gap-2 py-1">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Jamoa yoki a‘zo nomi..." class="w-full sm:w-72" />
        <span class="ml-auto text-sm text-muted">Jami: {{ filtered.length }}</span>
      </div>
    </template>

    <UTable :data="filtered" :columns="columns" :loading="loading" empty="Jamoalar yo‘q" />

    <UModal v-model:open="scoreOpen" title="Ballni o‘zgartirish" :description="scoreTeam ? `${scoreTeam.name} — joriy ball: ${scoreTeam.score}` : ''">
      <template #body>
        <form id="score-form" class="flex flex-col gap-4" @submit.prevent="saveScore">
          <UFormField label="Ball miqdori" help="Musbat — bonus, manfiy — jarima. Ball 0 dan pastga tushmaydi" required>
            <UInputNumber v-model="scoreForm.points" class="w-full" />
          </UFormField>
          <UFormField label="Sabab" required>
            <UInput v-model="scoreForm.reason" placeholder="Masalan: qoidabuzarlik uchun jarima" class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Bekor qilish" @click="scoreOpen = false" />
          <UButton type="submit" form="score-form" :loading="scoreSaving" :disabled="!scoreForm.points || !scoreForm.reason.trim()" label="Saqlash" />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { MyTeam, ScoreboardRow, TeamSolve } from '~/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Mening jamoam — CTF Platforma' })

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const { user, fetchMe } = useAuth()

const team = ref<MyTeam | null>(null)
const rank = ref<number | null>(null)
const loading = ref(true)

const createName = ref('')
const joinCode = ref('')
const creating = ref(false)
const joining = ref(false)
const createdCode = ref<string | null>(null)
const busy = ref(false)

async function load() {
  loading.value = true
  try {
    team.value = await api.get<MyTeam>('/user/teams/my-team')
    // Reytingdagi o'rnini aniqlaymiz
    const board = await api.get<ScoreboardRow[]>('/tournament/scoreboard', undefined, { auth: false })
    rank.value = board.find(r => r.id === team.value?.id)?.rank ?? null
  }
  catch (e) {
    if ((e as { statusCode?: number }).statusCode === 404) team.value = null
    else notify.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

async function afterChange() {
  await Promise.all([load(), fetchMe()])
}

async function createTeam() {
  if (!createName.value.trim()) return
  creating.value = true
  try {
    const res = await api.post<{ message: string, team: { inviteCode: string } }>('/user/teams/create', { name: createName.value.trim() })
    createdCode.value = res.team.inviteCode
    notify.success(res.message, 'Taklif kodini jamoadoshlaringizga yuboring')
    createName.value = ''
    await afterChange()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    creating.value = false
  }
}

async function joinTeam() {
  if (!joinCode.value.trim()) return
  joining.value = true
  try {
    const res = await api.post<{ message: string }>('/user/teams/join', { inviteCode: joinCode.value.trim() })
    notify.success(res.message)
    joinCode.value = ''
    await afterChange()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    joining.value = false
  }
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    notify.success('Taklif kodi nusxalandi')
  }
  catch {
    notify.info('Nusxalab bo‘lmadi', code)
  }
}

async function regenerateCode() {
  const ok = await confirm({
    title: 'Taklif kodi yangilansinmi?',
    description: 'Eski kod bilan endi hech kim jamoaga qo‘shila olmaydi.',
    confirmLabel: 'Yangilash',
    color: 'warning',
  })
  if (!ok || !team.value) return
  busy.value = true
  try {
    const res = await api.post<{ message: string, inviteCode: string }>('/user/teams/invite-code')
    team.value.inviteCode = res.inviteCode
    notify.success(res.message)
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    busy.value = false
  }
}

async function kick(member: { id: string, username: string }) {
  const ok = await confirm({
    title: `«${member.username}» jamoadan chiqarilsinmi?`,
    confirmLabel: 'Chiqarish',
  })
  if (!ok) return
  try {
    const res = await api.del<{ message: string }>(`/user/teams/members/${member.id}`)
    notify.success(res.message)
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}

async function leave() {
  const lastMember = (team.value?.members.length ?? 0) <= 1
  const ok = await confirm({
    title: 'Jamoadan chiqmoqchimisiz?',
    description: lastMember
      ? 'Siz oxirgi a‘zosiz. Jamoa hech narsa yechmagan bo‘lsa, u o‘chiriladi.'
      : 'Qaytib qo‘shilish uchun yana taklif kodi kerak bo‘ladi.',
    confirmLabel: 'Chiqish',
  })
  if (!ok) return
  busy.value = true
  try {
    const res = await api.post<{ message: string }>('/user/teams/leave')
    notify.success(res.message)
    createdCode.value = null
    await afterChange()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    busy.value = false
  }
}

const solveColumns: TableColumn<TeamSolve>[] = [
  { accessorKey: 'challenge.title', header: 'Vazifa' },
  {
    accessorKey: 'challenge.category',
    header: 'Kategoriya',
    cell: ({ row }) => h(resolveComponent('UBadge'), {
      color: categoryColor(row.original.challenge.category),
      variant: 'subtle',
      label: row.original.challenge.category,
    }),
  },
  { accessorKey: 'user.username', header: 'Kim yechdi' },
  {
    accessorKey: 'pointsAwarded',
    header: 'Ball',
    cell: ({ row }) => h('span', { class: 'font-mono font-semibold text-primary' }, `+${row.original.pointsAwarded}`),
  },
  {
    accessorKey: 'submittedAt',
    header: 'Vaqt',
    cell: ({ row }) => h('span', { class: 'text-muted' }, formatDateTime(row.original.submittedAt)),
  },
]
</script>

<template>
  <div>
    <PageHeading title="Mening jamoam" description="Jamoa a‘zolari, taklif kodi va yechilgan vazifalar" icon="i-lucide-users" />

    <div v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <USkeleton class="h-40 lg:col-span-2" />
      <USkeleton class="h-40" />
    </div>

    <!-- Jamoa yo'q: yaratish yoki qo'shilish -->
    <div v-else-if="!team" class="grid gap-6 md:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-plus-circle" class="size-5 text-primary" />
            <h2 class="font-semibold text-highlighted">
              Yangi jamoa yaratish
            </h2>
          </div>
          <p class="mt-1 text-sm text-muted">
            Siz jamoa sardori bo‘lasiz va a‘zolarni taklif kodi orqali chaqirasiz.
          </p>
        </template>
        <form class="space-y-4" @submit.prevent="createTeam">
          <UFormField label="Jamoa nomi" help="3–32 belgi: harf, raqam, probel, _ . -">
            <UInput v-model="createName" placeholder="CyberPunks" class="w-full" :maxlength="32" />
          </UFormField>
          <UButton type="submit" label="Jamoa yaratish" icon="i-lucide-shield-plus" :loading="creating" :disabled="createName.trim().length < 3" block />
        </form>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-log-in" class="size-5 text-info" />
            <h2 class="font-semibold text-highlighted">
              Jamoaga qo‘shilish
            </h2>
          </div>
          <p class="mt-1 text-sm text-muted">
            Taklif kodini jamoa sardoridan so‘rang.
          </p>
        </template>
        <form class="space-y-4" @submit.prevent="joinTeam">
          <UFormField label="Taklif kodi">
            <UInput v-model="joinCode" placeholder="A1B2C3D4E5" class="w-full font-mono uppercase" :maxlength="16" />
          </UFormField>
          <UButton type="submit" color="info" label="Qo‘shilish" icon="i-lucide-user-plus" :loading="joining" :disabled="joinCode.trim().length < 4" block />
        </form>
      </UCard>
    </div>

    <!-- Jamoa mavjud -->
    <div v-else class="space-y-6">
      <UAlert
        v-if="team.isBanned"
        color="error"
        variant="subtle"
        icon="i-lucide-ban"
        title="Jamoangiz bloklangan"
        description="Bloklangan jamoa flag yubora olmaydi va reytingda ko‘rinmaydi. Administratorga murojaat qiling."
      />

      <UAlert
        v-if="createdCode"
        color="success"
        variant="subtle"
        icon="i-lucide-party-popper"
        title="Jamoa yaratildi!"
        :description="`Taklif kodi: ${createdCode}. Uni jamoadoshlaringizga yuboring.`"
        close
        @update:open="createdCode = null"
      />

      <div class="grid gap-4 lg:grid-cols-3">
        <UCard class="lg:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <span class="flex size-14 items-center justify-center rounded-xl bg-primary/15 text-2xl font-bold text-primary">
                {{ team.name[0]?.toUpperCase() }}
              </span>
              <div>
                <h2 class="text-xl font-bold text-highlighted">
                  {{ team.name }}
                </h2>
                <p class="text-sm text-muted">
                  {{ formatDate(team.createdAt) }} da tuzilgan · {{ team.members.length }}/{{ team.maxTeamSize }} a‘zo
                </p>
              </div>
            </div>
            <div class="flex gap-6 text-center">
              <div>
                <p class="font-mono text-3xl font-bold text-primary">
                  {{ team.score }}
                </p>
                <p class="text-xs text-muted">
                  ball
                </p>
              </div>
              <div>
                <p class="font-mono text-3xl font-bold text-highlighted">
                  {{ rank ? `#${rank}` : '—' }}
                </p>
                <p class="text-xs text-muted">
                  o‘rin
                </p>
              </div>
              <div>
                <p class="font-mono text-3xl font-bold text-highlighted">
                  {{ team.solves.length }}
                </p>
                <p class="text-xs text-muted">
                  yechim
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <p class="text-sm font-medium text-highlighted">
            Taklif kodi
          </p>
          <div class="mt-2 flex items-center gap-2">
            <code class="flex-1 rounded-md bg-elevated px-3 py-2 text-center font-mono text-lg tracking-widest text-highlighted">{{ team.inviteCode }}</code>
            <UTooltip text="Nusxalash">
              <UButton icon="i-lucide-copy" color="neutral" variant="outline" aria-label="Nusxalash" @click="copyCode(team.inviteCode)" />
            </UTooltip>
            <UTooltip v-if="team.isCaptain" text="Yangi kod yaratish">
              <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" aria-label="Yangilash" :loading="busy" @click="regenerateCode" />
            </UTooltip>
          </div>
          <p class="mt-2 text-xs text-muted">
            Jamoaga maksimal {{ team.maxTeamSize }} kishi qo‘shila oladi.
          </p>
        </UCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">
              A‘zolar
            </h3>
          </template>
          <ul class="space-y-2">
            <li v-for="m in team.members" :key="m.id" class="flex items-center justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2">
                <UAvatar :text="m.username[0]?.toUpperCase()" size="sm" />
                <div class="min-w-0">
                  <p class="flex items-center gap-1 truncate text-sm font-medium text-highlighted">
                    {{ m.username }}
                    <UTooltip v-if="m.id === team.captainId" text="Jamoa sardori">
                      <UIcon name="i-lucide-crown" class="size-4 text-warning" />
                    </UTooltip>
                    <span v-if="m.id === user?.id" class="text-xs font-normal text-muted">(siz)</span>
                  </p>
                  <p v-if="m.fullName" class="truncate text-xs text-muted">
                    {{ m.fullName }}
                  </p>
                </div>
              </div>
              <UButton
                v-if="team.isCaptain && m.id !== user?.id"
                icon="i-lucide-user-minus"
                color="error"
                variant="ghost"
                size="xs"
                aria-label="Chiqarish"
                @click="kick(m)"
              />
            </li>
          </ul>
          <template #footer>
            <UButton icon="i-lucide-log-out" color="error" variant="soft" label="Jamoadan chiqish" :loading="busy" block @click="leave" />
          </template>
        </UCard>

        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-highlighted">
                Guruhlar
              </h3>
              <UButton to="/challenges" size="xs" variant="link" trailing-icon="i-lucide-arrow-right" label="Vazifalarga o‘tish" />
            </div>
          </template>
          <div v-if="team.challengeGroups.length" class="flex flex-wrap gap-2">
            <UBadge v-for="g in team.challengeGroups" :key="g.id" color="primary" variant="subtle" icon="i-lucide-folder-check" :label="g.name" size="lg" />
          </div>
          <p v-else class="text-sm text-muted">
            Jamoa hali birorta guruhga qo‘shilmagan. Vazifalar sahifasida guruhga qo‘shiling.
          </p>
        </UCard>
      </div>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Yechilgan vazifalar
          </h3>
        </template>
        <UTable :data="team.solves" :columns="solveColumns" empty="Hali birorta vazifa yechilmagan" />
      </UCard>
    </div>
  </div>
</template>

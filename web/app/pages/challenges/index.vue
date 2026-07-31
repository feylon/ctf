<script setup lang="ts">
import type { Challenge, ChallengeGroupItem } from '~/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Vazifalar — CTF Platforma' })

const api = useApi()
const notify = useNotify()
const { user, fetchMe } = useAuth()
const { status: tournament, meta: tournamentMeta, countdownTarget, refresh: refreshTournament } = useTournament()

const groups = ref<ChallengeGroupItem[]>([])
const challenges = ref<Challenge[]>([])
const loading = ref(true)
const selectedGroup = ref<string>('all')
const joiningGroup = ref<string | null>(null)

const modalOpen = ref(false)
const activeId = ref<string | null>(null)

const hasTeam = computed(() => !!user.value?.team)

async function load() {
  try {
    const [g, c] = await Promise.all([
      api.get<ChallengeGroupItem[]>('/user/groups'),
      api.get<Challenge[]>('/user/challenges'),
    ])
    groups.value = g
    challenges.value = c
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  refreshTournament()
})

const groupTabs = computed(() => [
  { label: 'Barchasi', value: 'all' },
  ...groups.value.map(g => ({
    label: g.name,
    value: g.id,
    icon: g.joined ? 'i-lucide-check' : 'i-lucide-lock',
    badge: g.challengeCount,
  })),
])

const currentGroup = computed(() => groups.value.find(g => g.id === selectedGroup.value) ?? null)

const visible = computed(() =>
  selectedGroup.value === 'all'
    ? challenges.value
    : challenges.value.filter(c => c.group?.id === selectedGroup.value),
)

// Kategoriyalar bo'yicha guruhlash
const byCategory = computed(() => {
  const map = new Map<string, Challenge[]>()
  for (const c of visible.value) {
    const list = map.get(c.category) ?? []
    list.push(c)
    map.set(c.category, list)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
})

const solvedCount = computed(() => challenges.value.filter(c => c.solved).length)
const unjoinedGroups = computed(() => groups.value.filter(g => !g.joined))

async function joinGroup(group: { id: string, name: string }) {
  joiningGroup.value = group.id
  try {
    const res = await api.post<{ message: string }>(`/user/groups/${group.id}/join`)
    notify.success(res.message)
    await load()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    joiningGroup.value = null
  }
}

function openChallenge(c: Challenge) {
  activeId.value = c.id
  modalOpen.value = true
}

async function onSolved() {
  await Promise.all([load(), fetchMe()])
}
</script>

<template>
  <div>
    <PageHeading title="Vazifalar" description="CTF vazifalarini yeching va jamoangiz uchun ball to‘plang" icon="i-lucide-flag">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" label="Yangilash" :loading="loading" @click="load" />
      </template>
    </PageHeading>

    <UAlert
      v-if="!hasTeam"
      class="mb-6"
      color="warning"
      variant="subtle"
      icon="i-lucide-users"
      title="Siz hali jamoada emassiz"
      description="Flag yuborish uchun jamoa tuzing yoki taklif kodi orqali mavjud jamoaga qo‘shiling."
      :actions="[{ label: 'Jamoa sahifasi', to: '/team', color: 'warning', variant: 'solid' }]"
    />

    <UAlert
      v-if="tournament && tournament.state !== 'running' && tournamentMeta"
      class="mb-6"
      :color="tournamentMeta.color"
      variant="subtle"
      :icon="tournamentMeta.icon"
      :title="tournamentMeta.label"
    >
      <template v-if="countdownTarget" #description>
        Boshlanishiga: <CountdownTimer :target="countdownTarget" compact />
      </template>
    </UAlert>

    <!-- Qisqa statistika -->
    <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <p class="text-xs text-muted">
          Yechilgan vazifalar
        </p>
        <p class="mt-1 font-mono text-2xl font-bold text-highlighted">
          {{ solvedCount }}<span class="text-base text-muted"> / {{ challenges.length }}</span>
        </p>
        <UProgress class="mt-2" :model-value="challenges.length ? (solvedCount / challenges.length) * 100 : 0" size="xs" />
      </UCard>
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <p class="text-xs text-muted">
          Jamoa bali
        </p>
        <p class="mt-1 font-mono text-2xl font-bold text-primary">
          {{ user?.team?.score ?? 0 }}
        </p>
        <p class="mt-1 truncate text-xs text-muted">
          {{ user?.team?.name ?? 'Jamoa yo‘q' }}
        </p>
      </UCard>
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <p class="text-xs text-muted">
          Guruhlar
        </p>
        <p class="mt-1 font-mono text-2xl font-bold text-highlighted">
          {{ groups.length - unjoinedGroups.length }}<span class="text-base text-muted"> / {{ groups.length }}</span>
        </p>
        <p class="mt-1 text-xs text-muted">
          qo‘shilingan
        </p>
      </UCard>
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <p class="text-xs text-muted">
          Musobaqa
        </p>
        <p class="mt-1 text-sm font-semibold" :class="tournament?.state === 'running' ? 'text-success' : 'text-muted'">
          {{ tournamentMeta?.label ?? '—' }}
        </p>
        <p v-if="tournament?.state === 'running' && countdownTarget" class="mt-1 text-xs text-muted">
          Tugashiga: <CountdownTimer :target="countdownTarget" compact />
        </p>
      </UCard>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <USkeleton v-for="i in 8" :key="i" class="h-36" />
    </div>

    <template v-else>
      <UTabs
        v-if="groups.length"
        v-model="selectedGroup"
        :items="groupTabs"
        :content="false"
        variant="link"
        class="mb-6 overflow-x-auto"
      />

      <!-- Tanlangan guruhga qo'shilmagan bo'lsa -->
      <UAlert
        v-if="currentGroup && !currentGroup.joined && hasTeam"
        class="mb-6"
        color="info"
        variant="subtle"
        icon="i-lucide-lock-keyhole"
        :title="`Jamoangiz «${currentGroup.name}» guruhiga qo‘shilmagan`"
        description="Bu guruh vazifalariga flag yuborish uchun avval guruhga qo‘shiling."
        :actions="[{ label: 'Guruhga qo‘shilish', icon: 'i-lucide-log-in', loading: joiningGroup === currentGroup.id, onClick: () => joinGroup(currentGroup!) }]"
      />

      <div v-if="selectedGroup === 'all' && hasTeam && unjoinedGroups.length" class="mb-6 flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted">Qo‘shilmagan guruhlar:</span>
        <UButton
          v-for="g in unjoinedGroups"
          :key="g.id"
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-lucide-plus"
          :label="`${g.name} — qo‘shilish`"
          :loading="joiningGroup === g.id"
          @click="joinGroup(g)"
        />
      </div>

      <UEmpty
        v-if="!visible.length"
        icon="i-lucide-flag-off"
        title="Hozircha vazifalar yo‘q"
        description="Ochilgan vazifalar shu yerda paydo bo‘ladi."
      />

      <div v-for="[category, list] in byCategory" :key="category" class="mb-8">
        <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold text-highlighted">
          <UIcon :name="categoryIcon(category)" class="size-5" :class="categoryTextClass(category)" />
          {{ category }}
          <UBadge color="neutral" variant="subtle" size="sm" :label="`${list.filter(c => c.solved).length}/${list.length}`" />
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ChallengeCard v-for="c in list" :key="c.id" :challenge="c" @open="openChallenge(c)" />
        </div>
      </div>
    </template>

    <ChallengeModal v-model:open="modalOpen" :challenge-id="activeId" :has-team="hasTeam" @solved="onSolved" />
  </div>
</template>

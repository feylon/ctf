<script setup lang="ts">
import type { News, Paginated, ScoreboardRow } from '~/types/api'

useHead({ title: 'Bosh sahifa — CTF Platforma' })

const api = useApi()
const { loggedIn, user } = useAuth()
const { status: tournament, meta, countdownTarget } = useTournament()

const { data: news, status: newsStatus } = await useAsyncData(
  'home:news',
  () => api.get<Paginated<News>>('/news/pagination', { page: 1, limit: 3 }, { auth: false }),
)

const { data: topTeams, status: teamsStatus } = await useAsyncData(
  'home:scoreboard',
  async () => (await api.get<ScoreboardRow[]>('/tournament/scoreboard', undefined, { auth: false })).slice(0, 5),
)

const countdownLabel = computed(() => {
  if (tournament.value?.state === 'not_started') return 'Boshlanishiga qoldi'
  if (tournament.value?.state === 'running') return 'Tugashiga qoldi'
  return ''
})

const features = [
  {
    icon: 'i-lucide-flag',
    title: 'CTF vazifalar',
    description: 'Web, kriptografiya, reverse, forensics va boshqa yo‘nalishlarda flag toping. Har bir yechim bilan vazifa qiymati kamayadi.',
    to: '/challenges',
  },
  {
    icon: 'i-lucide-code-xml',
    title: 'Algoritmik masalalar',
    description: 'Musobaqadan tashqari ham mashq qiling: masalalarni yeching, javob yuboring va shaxsiy reytingda ko‘tariling.',
    to: '/problems',
  },
  {
    icon: 'i-lucide-trophy',
    title: 'Jamoaviy reyting',
    description: 'Do‘stlaringiz bilan jamoa tuzing, ballarni real vaqtda kuzating va eng kuchlilar qatoriga kiring.',
    to: '/scoreboard',
  },
]

const medal = (rank: number) => (['text-amber-400', 'text-zinc-300', 'text-orange-400'][rank - 1] ?? 'text-muted')
</script>

<template>
  <div class="space-y-16">
    <!-- Hero -->
    <section class="relative overflow-hidden rounded-2xl border border-default bg-elevated/30 px-6 py-14 text-center sm:px-12">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--ui-color-primary-500)/15%,transparent_65%)]" />
      <div class="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
        <UBadge v-if="meta" :color="meta.color" variant="subtle" :icon="meta.icon" :label="meta.label" size="lg" />

        <h1 class="text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">
          Capture The Flag <span class="text-primary">musobaqalari</span>
        </h1>
        <p class="text-lg text-muted">
          Kiberxavfsizlik bo‘yicha amaliy ko‘nikmalaringizni sinang: zaifliklarni toping, flaglarni qo‘lga kiriting va jamoangiz bilan reytingda yuqoriga chiqing.
        </p>

        <div v-if="countdownTarget" class="flex flex-col items-center gap-2">
          <span class="text-sm text-muted">{{ countdownLabel }}</span>
          <CountdownTimer :target="countdownTarget" />
        </div>

        <div class="flex flex-wrap justify-center gap-3">
          <template v-if="loggedIn">
            <UButton to="/challenges" size="lg" icon="i-lucide-flag" label="Vazifalarga o‘tish" />
            <UButton
              to="/team"
              size="lg"
              color="neutral"
              variant="outline"
              icon="i-lucide-users"
              :label="user?.team ? `Jamoa: ${user.team.name}` : 'Jamoa tuzish'"
            />
          </template>
          <template v-else>
            <UButton to="/register" size="lg" icon="i-lucide-user-plus" label="Ro‘yxatdan o‘tish" />
            <UButton to="/login" size="lg" color="neutral" variant="outline" icon="i-lucide-log-in" label="Kirish" />
          </template>
        </div>
      </div>
    </section>

    <!-- Imkoniyatlar -->
    <section class="grid gap-4 md:grid-cols-3">
      <NuxtLink v-for="f in features" :key="f.title" :to="f.to" class="block">
        <UCard class="h-full transition hover:ring-primary/50">
          <span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UIcon :name="f.icon" class="size-5" />
          </span>
          <h3 class="mt-4 font-semibold text-highlighted">
            {{ f.title }}
          </h3>
          <p class="mt-2 text-sm text-muted">
            {{ f.description }}
          </p>
        </UCard>
      </NuxtLink>
    </section>

    <section class="grid gap-6 lg:grid-cols-5">
      <!-- So'nggi yangiliklar -->
      <div class="lg:col-span-3">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-highlighted">
            So‘nggi yangiliklar
          </h2>
          <UButton to="/news" variant="link" trailing-icon="i-lucide-arrow-right" label="Barchasi" />
        </div>

        <div v-if="newsStatus === 'pending' && !news" class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-20 w-full" />
        </div>
        <UEmpty v-else-if="!news?.data.length" icon="i-lucide-newspaper" title="Hozircha yangiliklar yo‘q" variant="naked" />
        <div v-else class="space-y-3">
          <NuxtLink v-for="item in news.data" :key="item.id" :to="`/news/${item.id}`" class="block">
            <UCard :ui="{ body: 'p-4 sm:p-4' }" class="transition hover:ring-primary/50">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <h3 class="truncate font-medium text-highlighted">
                    {{ item.title }}
                  </h3>
                  <p class="mt-1 text-xs text-muted">
                    {{ timeAgo(item.createdAt) }}
                    <template v-if="item.author">
                      · {{ item.author.fullName || item.author.username }}
                    </template>
                  </p>
                </div>
                <UIcon name="i-lucide-chevron-right" class="mt-1 shrink-0 text-muted" />
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </div>

      <!-- Top jamoalar -->
      <div class="lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-highlighted">
            Top jamoalar
          </h2>
          <UButton to="/scoreboard" variant="link" trailing-icon="i-lucide-arrow-right" label="Reyting" />
        </div>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <div v-if="teamsStatus === 'pending' && !topTeams" class="space-y-2 p-4">
            <USkeleton v-for="i in 5" :key="i" class="h-8 w-full" />
          </div>
          <UEmpty
            v-else-if="!topTeams?.length"
            icon="i-lucide-trophy"
            title="Hali reyting yo‘q"
            description="Birinchi bo‘lib flag topgan jamoa shu yerda paydo bo‘ladi"
            variant="naked"
          />
          <ul v-else class="divide-y divide-default">
            <li v-for="team in topTeams" :key="team.id" class="flex items-center gap-3 px-4 py-3">
              <span class="w-6 text-center font-mono font-bold" :class="medal(team.rank)">
                <UIcon v-if="team.rank <= 3" name="i-lucide-medal" class="size-5" />
                <template v-else>{{ team.rank }}</template>
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium text-highlighted">
                  {{ team.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ team.solves }} ta yechim · {{ team.members.length }} a‘zo
                </p>
              </div>
              <span class="font-mono font-semibold text-primary">{{ team.score }}</span>
            </li>
          </ul>
        </UCard>
      </div>
    </section>
  </div>
</template>

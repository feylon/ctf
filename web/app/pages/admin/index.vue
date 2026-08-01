<script setup lang="ts">
import type { AdminStats } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Boshqaruv paneli — Admin' })

const api = useApi()
const notify = useNotify()

const stats = ref<AdminStats | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    stats.value = await api.get<AdminStats>('/admin/stats')
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}
onMounted(load)

const cards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: 'Foydalanuvchilar', value: s.counts.users, hint: `${s.counts.bannedUsers} ta bloklangan`, icon: 'i-lucide-users', to: '/admin/users' },
    { label: 'Jamoalar', value: s.counts.teams, hint: `${s.counts.groups} ta guruh`, icon: 'i-lucide-shield-half', to: '/admin/teams' },
    { label: 'Vazifalar (CTF)', value: s.counts.challenges, hint: `${s.categories.length} ta kategoriya`, icon: 'i-lucide-flag', to: '/admin/challenges' },
    { label: 'Masalalar', value: s.counts.problems, hint: `${s.submissions.problemSubmissions} ta urinish`, icon: 'i-lucide-code-xml', to: '/admin/problems' },
    { label: 'Flag yuborishlar', value: s.submissions.total, hint: `Oxirgi 24 soatda: ${s.submissions.last24h}`, icon: 'i-lucide-send', to: '/admin/submissions' },
    { label: 'To‘g‘ri javoblar', value: s.submissions.correct, hint: `Muvaffaqiyat: ${s.submissions.successRate}%`, icon: 'i-lucide-circle-check', to: '/admin/submissions' },
    { label: 'Yangiliklar', value: s.counts.news, hint: 'E‘lonlar soni', icon: 'i-lucide-newspaper', to: '/admin/news' },
  ]
})

const maxCategory = computed(() => Math.max(1, ...(stats.value?.categories.map(c => c.count) ?? [1])))
</script>

<template>
  <AdminPanel title="Boshqaruv paneli" icon="i-lucide-layout-dashboard">
    <template #actions>
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="loading" @click="load" />
    </template>

    <div v-if="loading && !stats" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <USkeleton v-for="i in 8" :key="i" class="h-28" />
    </div>

    <template v-else-if="stats">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NuxtLink v-for="card in cards" :key="card.label" :to="card.to">
          <UCard class="h-full transition hover:ring-primary/50">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-muted">
                  {{ card.label }}
                </p>
                <p class="mt-1 text-3xl font-bold text-highlighted tabular-nums">
                  {{ formatNumber(card.value) }}
                </p>
                <p class="mt-1 text-xs text-dimmed">
                  {{ card.hint }}
                </p>
              </div>
              <span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UIcon :name="card.icon" class="size-5" />
              </span>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">
              Kategoriyalar bo‘yicha vazifalar
            </h3>
          </template>
          <div v-if="stats.categories.length" class="flex flex-col gap-3">
            <div v-for="c in stats.categories" :key="c.category">
              <div class="mb-1 flex justify-between text-sm">
                <span class="flex items-center gap-2">
                  <UIcon :name="categoryIcon(c.category)" class="size-4 text-muted" />
                  {{ c.category }}
                </span>
                <span class="font-mono tabular-nums text-muted">{{ c.count }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-elevated">
                <div class="h-full rounded-full bg-primary" :style="{ width: `${(c.count / maxCategory) * 100}%` }" />
              </div>
            </div>
          </div>
          <UEmpty v-else icon="i-lucide-flag" title="Hali vazifalar yo‘q" />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">
              So‘nggi yechimlar
            </h3>
          </template>
          <ul v-if="stats.recentSolves.length" class="divide-y divide-default">
            <li v-for="s in stats.recentSolves" :key="s.id" class="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div class="min-w-0">
                <p class="truncate">
                  <span class="font-medium text-highlighted">{{ s.team?.name ?? '—' }}</span>
                  <span class="text-muted"> · {{ s.user?.username ?? '—' }}</span>
                </p>
                <p class="truncate text-xs text-muted">
                  {{ s.challenge?.title ?? 'O‘chirilgan vazifa' }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <UBadge v-if="s.pointsAwarded > 0" color="success" variant="subtle" :label="`+${s.pointsAwarded}`" />
                <UBadge v-else color="neutral" variant="subtle" label="takroriy" />
                <p class="mt-0.5 text-xs text-dimmed">
                  {{ timeAgo(s.submittedAt) }}
                </p>
              </div>
            </li>
          </ul>
          <UEmpty v-else icon="i-lucide-list-checks" title="Hali yechimlar yo‘q" />
        </UCard>
      </div>
    </template>
  </AdminPanel>
</template>

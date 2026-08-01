<script setup lang="ts">
import type { AdminUserDetail } from '~/types/api'

// Foydalanuvchi haqida batafsil ma'lumot (slideover ichida)
const props = defineProps<{ userId: string | null }>()
const open = defineModel<boolean>('open', { default: false })

const api = useApi()
const notify = useNotify()
const detail = ref<AdminUserDetail | null>(null)
const loading = ref(false)

watch(() => [props.userId, open.value] as const, async ([id, isOpen]) => {
  if (!id || !isOpen) return
  loading.value = true
  detail.value = null
  try {
    detail.value = await api.get<AdminUserDetail>(`/admin/users/${id}`)
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<template>
  <USlideover v-model:open="open" :title="detail?.username ?? 'Foydalanuvchi'" :description="detail?.email">
    <template #body>
      <div v-if="loading" class="flex flex-col gap-3">
        <USkeleton v-for="i in 6" :key="i" class="h-8" />
      </div>
      <div v-else-if="detail" class="flex flex-col gap-6">
        <div class="flex flex-wrap gap-2">
          <UBadge :color="ROLE_META[detail.role]?.color" variant="subtle" :label="ROLE_META[detail.role]?.label" />
          <UBadge v-if="detail.isBanned" color="error" variant="subtle" label="Bloklangan" />
          <UBadge v-if="!detail.isActive" color="warning" variant="subtle" label="Faol emas" />
          <UBadge v-if="detail.isDelete" color="neutral" variant="subtle" label="O‘chirilgan" />
        </div>

        <dl class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt class="text-muted">
              To‘liq ism
            </dt>
            <dd class="font-medium">
              {{ detail.fullName || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Jamoa
            </dt>
            <dd class="font-medium">
              {{ detail.team ? `${detail.team.name} (${detail.team.score})` : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Ball (masalalar)
            </dt>
            <dd class="font-medium tabular-nums">
              {{ detail.score }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Yechilgan masalalar
            </dt>
            <dd class="font-medium tabular-nums">
              {{ detail.problemsSolved }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Ro‘yxatdan o‘tgan
            </dt>
            <dd class="font-medium">
              {{ formatDateTime(detail.createdAt) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Yangilangan
            </dt>
            <dd class="font-medium">
              {{ formatDateTime(detail.updatedAt) }}
            </dd>
          </div>
        </dl>

        <div>
          <h4 class="mb-2 font-semibold text-highlighted">
            So‘nggi flag yuborishlar
          </h4>
          <ul v-if="detail.submissions.length" class="divide-y divide-default text-sm">
            <li v-for="s in detail.submissions" :key="s.id" class="flex items-center justify-between py-2">
              <span class="truncate">{{ s.challenge?.title ?? 'O‘chirilgan vazifa' }}</span>
              <span class="flex shrink-0 items-center gap-2">
                <UBadge :color="s.isCorrect ? 'success' : 'error'" variant="subtle" :label="s.isCorrect ? (s.pointsAwarded ? `+${s.pointsAwarded}` : 'to‘g‘ri') : 'xato'" />
                <span class="text-xs text-dimmed">{{ timeAgo(s.submittedAt) }}</span>
              </span>
            </li>
          </ul>
          <p v-else class="text-sm text-muted">
            Yuborishlar yo‘q
          </p>
        </div>

        <div>
          <h4 class="mb-2 font-semibold text-highlighted">
            Kirish tarixi
          </h4>
          <ul v-if="detail.loginHistory.length" class="divide-y divide-default text-sm">
            <li v-for="h in detail.loginHistory" :key="h.id" class="flex items-center justify-between py-2">
              <span class="font-mono text-xs">{{ h.ipAddress }}</span>
              <span class="flex items-center gap-2">
                <UBadge :color="h.status === 'success' ? 'success' : 'error'" variant="subtle" :label="h.status === 'success' ? 'muvaffaqiyatli' : 'xato'" />
                <span class="text-xs text-dimmed">{{ formatDateTime(h.createdAt) }}</span>
              </span>
            </li>
          </ul>
          <p v-else class="text-sm text-muted">
            Tarix bo‘sh
          </p>
        </div>
      </div>
    </template>
  </USlideover>
</template>

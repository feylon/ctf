<script setup lang="ts">
import type { ChallengeDetail, SubmitResult } from '~/types/api'

const props = defineProps<{ challengeId: string | null, hasTeam: boolean }>()
const emit = defineEmits<{ solved: [] }>()
const open = defineModel<boolean>('open', { default: false })

const api = useApi()
const notify = useNotify()
const { status: tournament } = useTournament()

const challenge = ref<ChallengeDetail | null>(null)
const loading = ref(false)
const flag = ref('')
const submitting = ref(false)
const result = ref<SubmitResult | null>(null)
const errorText = ref('')

async function load() {
  if (!props.challengeId) return
  loading.value = true
  challenge.value = null
  try {
    challenge.value = await api.get<ChallengeDetail>(`/user/challenges/${props.challengeId}`)
  }
  catch (e) {
    notify.error(e)
    open.value = false
  }
  finally {
    loading.value = false
  }
}

watch(() => [open.value, props.challengeId], ([isOpen]) => {
  if (isOpen) {
    flag.value = ''
    result.value = null
    errorText.value = ''
    load()
  }
}, { immediate: true })

// Flag yuborish mumkin bo'lmasa sababini ko'rsatamiz
const blockedReason = computed(() => {
  if (!props.hasTeam) return 'Flag yuborish uchun avval jamoaga qo‘shiling'
  if (tournament.value && tournament.value.state !== 'running') return TOURNAMENT_STATE_META[tournament.value.state].label
  if (challenge.value && !challenge.value.groupJoined) return 'Jamoangiz bu vazifa guruhiga qo‘shilmagan'
  if (challenge.value?.isClosed) return 'Bu vazifaning vaqti tugagan'
  return ''
})

async function submit() {
  if (!challenge.value || !flag.value.trim()) return
  submitting.value = true
  result.value = null
  errorText.value = ''
  try {
    result.value = await api.post<SubmitResult>(`/user/challenges/${challenge.value.id}/submit`, { flag: flag.value.trim() })
    if (result.value.success) {
      flag.value = ''
      if (result.value.pointsAwarded) {
        notify.success('To‘g‘ri flag!', `Jamoangizga ${result.value.pointsAwarded} ball qo‘shildi`)
      }
      emit('solved')
      await load()
    }
  }
  catch (e) {
    errorText.value = apiErrorMessage(e)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="challenge?.title ?? 'Yuklanmoqda…'" :ui="{ content: 'sm:max-w-2xl' }">
    <template #description>
      <div v-if="challenge" class="flex flex-wrap items-center gap-2">
        <UBadge :color="categoryColor(challenge.category)" variant="subtle" :icon="categoryIcon(challenge.category)" :label="challenge.category" />
        <UBadge color="primary" variant="soft" :label="`${challenge.points} ball`" />
        <UBadge v-if="challenge.group" color="neutral" variant="outline" icon="i-lucide-folder" :label="challenge.group.name" />
        <UBadge v-if="challenge.solved" color="success" variant="subtle" icon="i-lucide-check" label="Jamoangiz yechgan" />
      </div>
    </template>

    <template #body>
      <div v-if="loading" class="space-y-3">
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-2/3" />
      </div>

      <div v-else-if="challenge" class="space-y-6">
        <MarkdownContent :content="challenge.description" />

        <div v-if="challenge.attachmentPath">
          <UButton
            :to="fileUrl(challenge.attachmentPath)"
            target="_blank"
            external
            icon="i-lucide-download"
            color="neutral"
            variant="outline"
            label="Biriktirilgan faylni yuklab olish"
          />
        </div>

        <div v-if="challenge.startTime || challenge.endTime" class="flex flex-wrap gap-4 text-sm text-muted">
          <span v-if="challenge.startTime" class="flex items-center gap-1">
            <UIcon name="i-lucide-calendar-clock" class="size-4" /> Ochilgan: {{ formatDateTime(challenge.startTime) }}
          </span>
          <span v-if="challenge.endTime" class="flex items-center gap-1">
            <UIcon name="i-lucide-alarm-clock" class="size-4" /> Yopiladi: {{ formatDateTime(challenge.endTime) }}
            <template v-if="!challenge.isClosed">(<CountdownTimer :target="challenge.endTime" compact />)</template>
          </span>
        </div>

        <div>
          <p class="mb-2 text-sm font-medium text-highlighted">
            Birinchi yechganlar
          </p>
          <ol v-if="challenge.firstSolvers.length" class="space-y-1 text-sm">
            <li v-for="(s, i) in challenge.firstSolvers" :key="s.team.id" class="flex items-center justify-between rounded-md bg-elevated/50 px-3 py-1.5">
              <span class="flex items-center gap-2">
                <UIcon v-if="i === 0" name="i-lucide-droplet" class="size-4 text-error" />
                <span v-else class="w-4 text-center font-mono text-xs text-muted">{{ i + 1 }}</span>
                {{ s.team.name }}
              </span>
              <span class="text-muted">{{ timeAgo(s.solvedAt) }}</span>
            </li>
          </ol>
          <p v-else class="text-sm text-muted">
            Hali hech kim yechmagan. Birinchi bo‘ling!
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div v-if="challenge" class="w-full space-y-3">
        <UAlert v-if="blockedReason && !challenge.solved" color="warning" variant="subtle" icon="i-lucide-info" :title="blockedReason" />
        <UAlert
          v-if="result"
          :color="result.success ? 'success' : 'error'"
          variant="subtle"
          :icon="result.success ? 'i-lucide-party-popper' : 'i-lucide-x-circle'"
          :title="result.message"
        />
        <UAlert v-if="errorText" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorText" />

        <form class="flex gap-2" @submit.prevent="submit">
          <UInput
            v-model="flag"
            placeholder="CTF{...}"
            icon="i-lucide-flag"
            class="flex-1 font-mono"
            :disabled="!!blockedReason"
            autocomplete="off"
          />
          <UButton type="submit" label="Yuborish" icon="i-lucide-send" :loading="submitting" :disabled="!!blockedReason || !flag.trim()" />
        </form>
      </div>
    </template>
  </UModal>
</template>

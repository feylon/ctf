<script setup lang="ts">
import type { ProblemAttempt, ProblemDetail } from '~/types/api'

const route = useRoute()
const api = useApi()
const notify = useNotify()
const { loggedIn, fetchMe } = useAuth()

const id = computed(() => route.params.id as string)
const problem = ref<ProblemDetail | null>(null)
const attempts = ref<ProblemAttempt[]>([])
const loading = ref(true)
const notFound = ref(false)

const answer = ref('')
const submitting = ref(false)
const result = ref<{ success: boolean, message: string } | null>(null)

useHead({ title: () => (problem.value ? `${problem.value.code}. ${problem.value.title} — Masalalar` : 'Masala') })

async function loadAttempts() {
  if (!loggedIn.value) return
  try {
    attempts.value = await api.get<ProblemAttempt[]>(`/problems/${id.value}/submissions`)
  }
  catch {
    attempts.value = []
  }
}

async function load() {
  loading.value = true
  try {
    problem.value = await api.get<ProblemDetail>(`/problems/${id.value}`)
    await loadAttempts()
  }
  catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 404 || status === 400) notFound.value = true
    else notify.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

async function submit() {
  if (!answer.value.trim()) return
  submitting.value = true
  result.value = null
  try {
    result.value = await api.post<{ success: boolean, message: string }>(`/problems/${id.value}/submit`, { flag: answer.value.trim() })
    if (result.value.success) {
      answer.value = ''
      notify.success('To‘g‘ri javob!', result.value.message)
      await Promise.all([load(), fetchMe()])
    }
    else {
      await loadAttempts()
    }
  }
  catch (e) {
    result.value = { success: false, message: apiErrorMessage(e) }
  }
  finally {
    submitting.value = false
  }
}

const difficulty = computed(() => (problem.value ? difficultyMeta(problem.value.difficulty) : null))
</script>

<template>
  <div>
    <UButton to="/problems" variant="link" color="neutral" icon="i-lucide-arrow-left" label="Masalalar ro‘yxati" class="mb-4 -ml-2.5" />

    <div v-if="loading && !problem" class="grid gap-6 lg:grid-cols-3">
      <div class="space-y-3 lg:col-span-2">
        <USkeleton class="h-8 w-1/2" />
        <USkeleton class="h-64" />
      </div>
      <USkeleton class="h-64" />
    </div>

    <UEmpty
      v-else-if="notFound"
      icon="i-lucide-file-question"
      title="Masala topilmadi"
      description="Bu masala o‘chirilgan yoki manzil noto‘g‘ri."
      :actions="[{ label: 'Ro‘yxatga qaytish', to: '/problems' }]"
    />

    <div v-else-if="problem" class="grid gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <div>
          <p class="font-mono text-sm text-muted">
            {{ problem.code }}
          </p>
          <h1 class="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold text-highlighted">
            {{ problem.title }}
            <UBadge v-if="problem.isSolved" color="success" variant="subtle" icon="i-lucide-check" label="Yechilgan" />
          </h1>
          <div class="mt-3 flex flex-wrap gap-2">
            <UBadge :color="categoryColor(problem.category)" variant="subtle" :label="problem.category" />
            <UBadge v-if="difficulty" :color="difficulty.color" variant="outline" :label="`${difficulty.label} · ${problem.difficulty}`" />
            <UBadge color="primary" variant="soft" :label="`${problem.points} ball`" />
          </div>
        </div>

        <UCard>
          <MarkdownContent :content="problem.description" />
        </UCard>

        <!-- Javob yuborish -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Javob yuborish
            </h2>
          </template>

          <div v-if="!loggedIn" class="flex flex-col items-start gap-3">
            <p class="text-sm text-muted">
              Javob yuborish uchun tizimga kiring.
            </p>
            <UButton :to="{ path: '/login', query: { redirect: route.fullPath } }" label="Kirish" icon="i-lucide-log-in" />
          </div>

          <UAlert
            v-else-if="problem.isSolved"
            color="success"
            variant="subtle"
            icon="i-lucide-party-popper"
            title="Siz bu masalani yechgansiz"
            :description="`Hisobingizga ${problem.points} ball qo‘shilgan.`"
          />

          <form v-else class="space-y-3" @submit.prevent="submit">
            <div class="flex gap-2">
              <UInput v-model="answer" placeholder="Javobni kiriting" icon="i-lucide-pencil" class="flex-1 font-mono" autocomplete="off" />
              <UButton type="submit" label="Yuborish" icon="i-lucide-send" :loading="submitting" :disabled="!answer.trim()" />
            </div>
            <UAlert
              v-if="result"
              :color="result.success ? 'success' : 'error'"
              variant="subtle"
              :icon="result.success ? 'i-lucide-circle-check' : 'i-lucide-x-circle'"
              :title="result.message"
            />
          </form>
        </UCard>
      </div>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Statistika
            </h2>
          </template>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted">
                Yechganlar
              </dt>
              <dd class="font-mono font-semibold text-highlighted">
                {{ problem.solvedCount }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">
                Jami urinishlar
              </dt>
              <dd class="font-mono font-semibold text-highlighted">
                {{ problem.totalTries }}
              </dd>
            </div>
            <div>
              <div class="mb-1 flex justify-between">
                <dt class="text-muted">
                  Muvaffaqiyat darajasi
                </dt>
                <dd class="font-mono font-semibold text-highlighted">
                  {{ problem.successRate }}%
                </dd>
              </div>
              <UProgress :model-value="problem.successRate" size="xs" />
            </div>
            <div v-if="loggedIn" class="flex justify-between">
              <dt class="text-muted">
                Mening urinishlarim
              </dt>
              <dd class="font-mono font-semibold text-highlighted">
                {{ problem.myAttempts }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">
                Qo‘shilgan
              </dt>
              <dd class="text-highlighted">
                {{ formatDate(problem.createdAt) }}
              </dd>
            </div>
          </dl>
        </UCard>

        <UCard v-if="loggedIn">
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Mening urinishlarim
            </h2>
          </template>
          <ul v-if="attempts.length" class="space-y-2 text-sm">
            <li v-for="a in attempts" :key="a.id" class="flex items-center justify-between">
              <span class="flex items-center gap-2">
                <UIcon :name="a.isCorrect ? 'i-lucide-circle-check' : 'i-lucide-circle-x'" :class="a.isCorrect ? 'text-success' : 'text-error'" class="size-4" />
                {{ a.isCorrect ? 'Qabul qilindi' : 'Noto‘g‘ri javob' }}
              </span>
              <span class="text-muted">{{ timeAgo(a.submittedAt) }}</span>
            </li>
          </ul>
          <p v-else class="text-sm text-muted">
            Hali urinishlar yo‘q.
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>
